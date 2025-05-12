require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "Tinfoil"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => '17.0' }
  s.source       = { :git => "https://github.com/tinfoilsh/tinfoil-react-native.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,cpp,swift}"
  s.private_header_files = "ios/**/*.h"
  s.swift_version = '5.9'

  spm_dependency s,
    url: 'https://github.com/tinfoilsh/tinfoil-swift.git',
    requirement: { kind: 'branch', branch: 'jules-dev' },
    products: ['TinfoilKit']

 install_modules_dependencies(s)
end
