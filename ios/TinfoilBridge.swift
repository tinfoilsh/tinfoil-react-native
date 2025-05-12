import Foundation
import TinfoilKit
import OpenAIKit

// Quick wrapper so arbitrary strings satisfy `ModelID`
private struct AnyModel: ModelID {
  let id: String
}

@objc(TinfoilBridge)           // give Obj-C something to see
public final class TinfoilBridge: NSObject {

  private var client: TinfoilAI?

  // MARK: – Public API exposed to Obj-C

  @objc
  public func initialize(
    _ apiKey: String?,
    githubRepo: String,
    enclaveURL: String,
    completion: @escaping (NSError?) -> Void
  ) {
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
}
