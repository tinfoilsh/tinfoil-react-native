import Foundation
import TinfoilKit              // from the SPM package
import OpenAIKit               // transitively included

@objc(TinfoilBridge)           // give Obj-C something to see
final class TinfoilBridge: NSObject {

  private var client: TinfoilAI?

  // MARK: – Public API exposed to Obj-C

  @objc
  func initialize(
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
  func chatCompletion(
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
          guard let role = dict["role"] as? String,
                let content = dict["content"] as? String
          else { throw NSError(domain: "Tinfoil", code: 1) }

          return Chat.Message(role: .init(rawValue: role), content: content)
        }

        let resp = try await client.client.chats.create(
          model: model,
          messages: swiftMsgs
        )
        completion(resp.choices.first?.message.content, nil)
      } catch {
        completion(nil, error as NSError)
      }
    }
  }
}