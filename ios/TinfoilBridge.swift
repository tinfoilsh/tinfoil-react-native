import Foundation
import TinfoilKit
import OpenAIKit
import React

// Quick wrapper so arbitrary strings satisfy `ModelID`
private struct AnyModel: ModelID {
  let id: String
}

@objc(TinfoilBridge)           // give Obj-C something to see
public final class TinfoilBridge: NSObject {

  private var client: TinfoilAI?
  private var currentGithubRepo: String?
  private var currentEnclaveURL: String?

  // MARK: – Public API exposed to Obj-C

  @objc
  public func initialize(
    _ apiKey: String?,
    githubRepo: String,
    enclaveURL: String,
    completion: @escaping (NSError?) -> Void
  ) {
    // Remember for later verification.
    self.currentGithubRepo = githubRepo
    self.currentEnclaveURL = enclaveURL
    Task.detached {
      do {
        self.client = try await TinfoilAI(
          apiKey: apiKey,
          githubRepo: githubRepo,
          enclaveURL: enclaveURL
        )
        completion(nil)
      } catch {
        completion(error as NSError)
      }
    }
  }

  @objc
  public func chatCompletion(
    _ model: String,
    messages: [[String: Any]],
    completion: @escaping (String?, NSError?) -> Void
  ) {
    guard let client else {
      completion(nil, NSError(
        domain: "Tinfoil",
        code: 0,
        userInfo: [NSLocalizedDescriptionKey: "Client not initialized"]
      ))
      return
    }

    Task.detached {
      do {
        // convert dictionaries back to Chat.Message
        let swiftMsgs: [Chat.Message] = try messages.compactMap { dict in
          guard
            let role   = dict["role"]    as? String,
            let content = dict["content"] as? String
          else {
            throw NSError(
              domain: "Tinfoil",
              code:   1,
              userInfo: [NSLocalizedDescriptionKey: "Invalid chat message"]
            )
          }

          switch role {
          case "system":    return .system(content: content)
          case "user":      return .user(content: content)
          case "assistant": return .assistant(content: content)
          default:
            throw NSError(
              domain: "Tinfoil",
              code:   2,
              userInfo: [NSLocalizedDescriptionKey: "Unknown role '\(role)'"]
            )
          }
        }

        let resp = try await client.client.chats.create(
          model: AnyModel(id: model),
          messages: swiftMsgs
        )
        completion(resp.choices.first?.message.content, nil)
      } catch {
        completion(nil, error as NSError)
      }
    }
  }

  @objc(chatCompletionStream:messages:onOpenBridge:onChunkBridge:onDoneBridge:onErrorBridge:)
  public func chatCompletionStream(
    _ model: String,
    messages: [[String: Any]],
    onOpenBridge: @escaping () -> Void,
    onChunkBridge: @escaping (String) -> Void,
    onDoneBridge: @escaping () -> Void,
    onErrorBridge: @escaping (Error) -> Void
  ) {
    guard let client else {
      onErrorBridge(NSError(domain: "Tinfoil", code: 0, userInfo: [NSLocalizedDescriptionKey: "Client not initialized"]))
      return
    }

    // Convert JS messages → Swift Chat.Message
    do {
      let msgs: [Chat.Message] = try messages.map { dict in
        guard let role = dict["role"] as? String,
              let content = dict["content"] as? String
        else { throw NSError(domain: "Tinfoil", code: 0) }

        switch role {
        case "system":    return .system(content: content)
        case "user":      return .user(content: content)
        case "assistant": return .assistant(content: content)
        default: throw NSError(domain: "Tinfoil", code: 1)
        }
      }

      Task.detached {
        do {
          onOpenBridge()

          let stream = try await client.client.chats.stream(
            model: AnyModel(id: model),
            messages: msgs
          )

          for try await chunk in stream {
            if let delta = chunk.choices.first?.delta.content {
              onChunkBridge(delta)
            }
          }
          onDoneBridge()
        } catch {
          onErrorBridge(error as NSError)
        }
      }
    } catch {
      onErrorBridge(error as NSError)
    }
  }

  // MARK: – Verification ------------------------------------------------------

  @objc
  public func verify(
    onCodeVerificationComplete: @escaping RCTResponseSenderBlock,
    onRuntimeVerificationComplete: @escaping RCTResponseSenderBlock,
    onSecurityCheckComplete: @escaping RCTResponseSenderBlock,
    completion: @escaping ([String: Any]?, NSError?) -> Void
  ) {
    guard
      let githubRepo = currentGithubRepo,
      let enclaveURL = currentEnclaveURL
    else {
      completion(nil, NSError(
        domain: "Tinfoil",
        code: 3,
        userInfo: [NSLocalizedDescriptionKey: "Client not initialized"]
      ))
      return
    }

    Task.detached {
      do {
        // Build progress callbacks that forward payloads straight to JS.
        let callbacks = VerificationCallbacks(
          onCodeVerificationComplete: { res in
            onCodeVerificationComplete([Self.progressDict(from: res)])
          },
          onRuntimeVerificationComplete: { res in
            onRuntimeVerificationComplete([Self.progressDict(from: res)])
          },
          onSecurityCheckComplete: { res in
            onSecurityCheckComplete([Self.progressDict(from: res)])
          }
        )

        let secureClient = SecureClient(
          githubRepo: githubRepo,
          enclaveURL: enclaveURL,
          callbacks: callbacks
        )

        let vr = try await secureClient.verify()
        completion(Self.resultDict(from: vr), nil)
      } catch {
        completion(nil, error as NSError)
      }
    }
  }

  // MARK: – Helpers -----------------------------------------------------------

  private static func progressDict(from anyResult: Any) -> [String: Any] {
    // If we got TinfoilKit.StepResult – turn it into a JS-friendly dictionary.
    if let step = anyResult as? StepResult {
      switch step.status {
      case .success:
        return ["status": "success",
                "digest": step.digest as Any]      // digest is on the struct
      case .failure(let error):
        return ["status": "failure",
                "error":  error.localizedDescription]
      case .pending:
        return ["status": "pending"]
      case .inProgress:
        return ["status": "inProgress"]
      }
    }

    // Fallback for unexpected types – stringify so the bridge never crashes.
    return ["status": "failure",
            "error": String(describing: anyResult)]
  }

  private static func resultDict(from res: Any) -> [String: Any] {
    if let vr = res as? VerificationResult {
      return [
        "isMatch": vr.isMatch,
        "codeDigest": vr.codeDigest,
        "runtimeDigest": vr.runtimeDigest,
        "publicKeyFP": vr.publicKeyFP,
      ]
    }
    return ["result": String(describing: res)]
  }
}
