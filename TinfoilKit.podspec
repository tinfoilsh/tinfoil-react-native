Pod::Spec.new do |s|
  s.name             = 'TinfoilKit'
  s.version          = '0.0.2'
  s.summary          = 'Secure Swift client for verified Tinfoil enclaves (wrapper around OpenAI-Kit).'
  s.homepage         = 'https://github.com/tinfoilsh/tinfoil-swift'
  s.license          = { :type => 'MIT', :file => 'LICENSE' }
  s.authors          = { 'Tinfoil' => 'contact@tinfoil.sh' }
  s.source           = { :git => 'https://github.com/tinfoilsh/tinfoil-swift.git',
                         :tag => "v#{s.version}" }
  s.source_files     = 'Sources/**/*.{swift}'
  s.swift_version    = '5.9'
  s.ios.deployment_target = '17.0'
  s.macos.deployment_target = '12.0'

  s.prepare_command = <<-CMD
  test -d TinfoilVerifier.xcframework || (
    curl -L -o tv.zip https://github.com/tinfoilsh/verifier/releases/download/v0.1.4/TinfoilVerifier.xcframework.zip
    unzip -q tv.zip
  )
  CMD
  s.vendored_frameworks = 'TinfoilVerifier.xcframework'

spm_dependency s,
    url: 'https://github.com/dylanshine/openai-kit.git',
    requirement: { kind: 'upToNextMajorVersion', minimumVersion: '1.0.0' },
    products: ['OpenAIKit']
end