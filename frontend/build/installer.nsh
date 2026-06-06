; ── AI DeskPet 自定义 NSIS 安装脚本 ─────────────────────────
; 在 electron-builder 生成的安装包基础上补充自定义行为

; 安装完成页显示运行选项
!macro customInstall
  CreateDirectory $SMPrograms\AI DeskPet
  CreateShortcut $SMPrograms\AI DeskPet\AI DeskPet.lnk $INSTDIR\AI DeskPet.exe
  CreateShortcut $SMPrograms\AI DeskPet\卸载 AI DeskPet.lnk $INSTDIR\Uninstall AI DeskPet.exe
!macroend

; 卸载时删除用户数据（可选）
!macro customUnInstall
  ; 默认不删除用户数据（保留聊天记录和设置）
  ; 如需完全清理，取消注释以下行：
  ; RMDir /r $APPDATA\AI DeskPet
!macroend

; 安装完成后询问是否运行
!macro customRemoveFiles
  ; 默认不删除用户数据目录
!macroend