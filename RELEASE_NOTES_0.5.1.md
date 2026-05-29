# English Immerser 0.5.1

## 版本定位

0.5.1 是一次发布链路修复版本，重点解决 v0.5.0 GitHub Actions 在 updater 签名阶段因为旧私钥密码不匹配而失败的问题。

## 修复内容

- 重新生成 Tauri updater signing keypair。
- 更新 `src-tauri/tauri.conf.json` 中的 updater 公钥。
- 将发布版本同步到 `0.5.1`。
- 移除 release workflow 中 tauri-action 不再识别的 `uploadUpdaterJson` 和 `uploadUpdaterSignatures` 输入项。

## 发布说明

- 本版本不包含 UI 或学习功能变更。
- 用户本地数据目录结构不变。
- GitHub Actions 仍然通过 `TAURI_SIGNING_PRIVATE_KEY` 和 `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` 完成 updater 签名。

