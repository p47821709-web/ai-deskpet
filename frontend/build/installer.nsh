; ── AI DeskPet 自定义 NSIS 安装脚本 ─────────────────────────
; 在 electron-builder 生成的安装包基础上补充自定义行为

; 安装完成页添加开始菜单快捷方式
!macro customInstall
  CreateDirectory "$SMPrograms\AI DeskPet"
  CreateShortCut "$SMPrograms\AI DeskPet\AI DeskPet.lnk" "$INSTDIR\AI DeskPet.exe"
  CreateShortCut "$SMPrograms\AI DeskPet\卸载 AI DeskPet.lnk" "$INSTDIR\Uninstall AI DeskPet.exe"
!macroend

; 卸载时保留用户数据（聊天记录和设置）
!macro customUnInstall
  ; 如需完全清理，取消注释以下行：
  ; RMDir /r "$APPDATA\AI DeskPet"
!macroend
