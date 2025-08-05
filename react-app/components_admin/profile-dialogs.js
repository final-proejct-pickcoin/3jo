"use client";
import { memo, useEffect } from "react";
import { useProfileData } from "@/hooks/useProfileData";
import { ProfileDialog } from "@/components_admin/dialogs/ProfileDialog";
import { PasswordDialog } from "@/components_admin/dialogs/PasswordDialog";
import { SecurityDialog } from "@/components_admin/dialogs/SecurityDialog";
import { HelpDialog } from "@/components_admin/dialogs/HelpDialog";

const ProfileDialogs = memo(({
  isDarkMode,
  isProfileDialogOpen,
  setIsProfileDialogOpen,
  isPasswordDialogOpen,
  setIsPasswordDialogOpen,
  isSecurityDialogOpen,
  setIsSecurityDialogOpen,
  isHelpDialogOpen,
  setIsHelpDialogOpen,
  profileData: externalProfileData,
  setProfileData: externalSetProfileData,
  passwordData: externalPasswordData,
  setPasswordData: externalSetPasswordData
}) => {
  const {
    profileData: internalProfileData,
    passwordData: internalPasswordData,
    showPasswords,
    passwordError,
    securitySettings,
    getDarkClass,
    profileInputHandler,
    passwordInputHandler,
    togglePasswordVisibility,
    toggleSecuritySetting,
    handleProfileSave,
    handlePasswordChange,
    handleSecuritySave,
    setProfileData
  } = useProfileData();

  // 외부에서 전달된 데이터가 있으면 사용, 없으면 내부 데이터 사용
  const effectiveProfileData = externalProfileData || internalProfileData;
  const effectivePasswordData = externalPasswordData || internalPasswordData;

  // 외부 데이터가 변경되면 내부 상태도 업데이트
  useEffect(() => {
    if (externalProfileData && Object.keys(externalProfileData).length > 0) {
      setProfileData(externalProfileData);
    }
  }, [externalProfileData, setProfileData]);

  return (
    <>
      <ProfileDialog
        isOpen={isProfileDialogOpen}
        onClose={() => setIsProfileDialogOpen(false)}
        isDarkMode={isDarkMode}
        profileData={effectiveProfileData}
        handleInputChange={profileInputHandler}
        handleProfileSave={handleProfileSave}
        getDarkClass={getDarkClass}
      />

      <PasswordDialog
        isOpen={isPasswordDialogOpen}
        onClose={() => setIsPasswordDialogOpen(false)}
        isDarkMode={isDarkMode}
        passwordData={effectivePasswordData}
        showPasswords={showPasswords}
        passwordError={passwordError}
        handleInputChange={passwordInputHandler}
        togglePasswordVisibility={togglePasswordVisibility}
        handlePasswordChange={handlePasswordChange}
        getDarkClass={getDarkClass}
      />

      <SecurityDialog
        isOpen={isSecurityDialogOpen}
        onClose={() => setIsSecurityDialogOpen(false)}
        isDarkMode={isDarkMode}
        securitySettings={securitySettings}
        toggleSecuritySetting={toggleSecuritySetting}
        handleSecuritySave={handleSecuritySave}
        getDarkClass={getDarkClass}
      />

      <HelpDialog
        isOpen={isHelpDialogOpen}
        onClose={() => setIsHelpDialogOpen(false)}
        isDarkMode={isDarkMode}
        getDarkClass={getDarkClass}
      />
    </>
  );
});

ProfileDialogs.displayName = 'ProfileDialogs';

export default ProfileDialogs;