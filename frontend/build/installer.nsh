; ── AI DeskPet NSIS 自定义安装脚本 ───────────────────────────
; 在 electron-builder 生成的 NSIS 安装程序中注入自定义行为

!macro customHeader
  ; 自定义安装程序标题
  ; 添加安装程序版本信息
  VIProductVersion "${VERSION}.0"
  VIAddVersionKey "ProductName" "AI DeskPet"
  VIAddVersionKey "CompanyName" "AI DeskPet"
  VIAddVersionKey "LegalCopyright" "Copyright © 2026 AI DeskPet"
!macroend

!macro customInstall
  ; 安装完成后自动启动
  CreateShortCut "$SMSTARTUP\AI DeskPet.lnk" "$INSTDIR\AI DeskPet.exe"

  ; 创建数据目录
  CreateDirectory "$APPDATA\AI DeskPet\logs"
  CreateDirectory "$APPDATA\AI DeskPet\data"
  CreateDirectory "$APPDATA\AI DeskPet\storage"

  ; 写注册表 — 安装路径
  WriteRegStr HKCU "Software\AI DeskPet" "InstallDir" "$INSTDIR"
!macroend

!macro customUnInstall
  ; 卸载时询问是否保留用户数据
  MessageBox MB_YESNO|MB_ICONQUESTION \
    "是否保留桌宠数据和个人设置？$_Hk_选择"是"可保留数据以便重新安装后恢复。" \
    IDYES keepData

  ; 删除用户数据
  RMDir /r "$APPDATA\AI DeskPet"
  GOTO done

keepData:
  ; 仅删除安装目录
  Delete "$SMSTARTUP\AI DeskPet.lnk"
  GOTO done

done:
!macroend
