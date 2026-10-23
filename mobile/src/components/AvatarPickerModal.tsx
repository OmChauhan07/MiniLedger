// Purpose: Modal allowing users to pick a profile photo from device gallery, preview it, and upload or remove it.
// Imported by: src/features/account/AccountScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { User } from '../types/index';
import { uploadAvatarApi, deleteAvatarApi } from '../api/account.api';
import { CameraIcon, TrashIcon, CheckIcon } from './Icons';
import { Theme } from '../theme/index';
import { getInitials } from '../utils/format';

interface AvatarPickerModalProps {
  visible: boolean;
  user: User;
  onClose: () => void;
  onAvatarUpdated: (updatedUser: User) => void;
}

export function AvatarPickerModal({
  visible,
  user,
  onClose,
  onAvatarUpdated,
}: AvatarPickerModalProps) {
  const [selectedUri, setSelectedUri] = useState<string | null>(null);
  const [selectedBase64, setSelectedBase64] = useState<string | null>(null);
  const [selectedMimeType, setSelectedMimeType] = useState<string>('image/jpeg');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setSelectedUri(null);
      setSelectedBase64(null);
      setSelectedMimeType('image/jpeg');
      setIsLoading(false);
      setErrorMessage(null);
    }
  }, [visible, user]);

  const userInitials = user.name ? getInitials(user.name) : user.phone ? user.phone.slice(-2) : 'ML';

  const handlePickFromGallery = async () => {
    setErrorMessage(null);
    try {
      // Request media library permission
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Photo Access Required',
          'MiniLedger needs access to your photo library to set a profile photo. Please grant permission in your device settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch picker with 1:1 aspect ratio square crop
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedUri(asset.uri);
        setSelectedBase64(asset.base64 || null);
        setSelectedMimeType(asset.mimeType || 'image/jpeg');
      }
    } catch (err: any) {
      console.warn('Error launching image picker:', err);
      setErrorMessage('Could not open gallery. Please try again.');
    }
  };

  const handleUpload = async () => {
    if (!selectedBase64) {
      setErrorMessage('No image selected to upload.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await uploadAvatarApi(selectedBase64, selectedMimeType);
      setIsLoading(false);
      onAvatarUpdated(response.user);
      onClose();
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Failed to upload profile picture. Please try again.');
    }
  };

  const handleRemoveAvatar = () => {
    Alert.alert(
      'Remove Profile Photo',
      'Are you sure you want to remove your profile picture and revert to your initials avatar?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            setErrorMessage(null);
            try {
              const res = await deleteAvatarApi();
              setIsLoading(false);
              onAvatarUpdated(res.user);
              onClose();
            } catch (err: any) {
              setIsLoading(false);
              setErrorMessage(err.message || 'Failed to remove profile photo.');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.headerKicker}>ACCOUNT PHOTO</Text>
              <Text style={styles.headerTitle}>Profile Picture</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              style={styles.closeBtn}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Error Banner */}
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Avatar Preview Area */}
          <View style={styles.previewContainer}>
            <View style={styles.avatarPreviewCircle}>
              {selectedUri ? (
                <Image
                  source={{ uri: selectedUri }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              ) : user.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.previewInitials}>{userInitials}</Text>
              )}
            </View>

            <Text style={styles.previewCaption}>
              {selectedUri
                ? 'Previewing selected image. Tap Save to apply.'
                : user.avatarUrl
                ? 'Current profile photo. Tap below to change or remove.'
                : 'No photo selected. Add a photo to personalize your account.'}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            {selectedUri ? (
              // Actions when an image is previewed
              <View style={styles.buttonCol}>
                <TouchableOpacity
                  style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
                  onPress={handleUpload}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <CheckIcon size={14} color="#FFFFFF" strokeWidth={2.4} />
                      <Text style={styles.primaryBtnText}>Save Profile Photo</Text>
                    </>
                  )}
                </TouchableOpacity>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.secondaryBtn, { flex: 1, marginRight: 8 }]}
                    onPress={handlePickFromGallery}
                    disabled={isLoading}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.secondaryBtnText}>Choose Other</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.secondaryBtn, { flex: 1, marginLeft: 8 }]}
                    onPress={() => setSelectedUri(null)}
                    disabled={isLoading}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.secondaryBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              // Actions when viewing current avatar
              <View style={styles.buttonCol}>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handlePickFromGallery}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <CameraIcon size={16} color="#FFFFFF" />
                  <Text style={styles.primaryBtnText}>
                    {user.avatarUrl ? 'Choose New Photo' : 'Select from Gallery'}
                  </Text>
                </TouchableOpacity>

                {user.avatarUrl ? (
                  <TouchableOpacity
                    style={[styles.dangerBtn, isLoading && styles.btnDisabled]}
                    onPress={handleRemoveAvatar}
                    disabled={isLoading}
                    activeOpacity={0.7}
                  >
                    <TrashIcon size={14} color="#DC2626" />
                    <Text style={styles.dangerBtnText}>Remove Photo</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerKicker: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '700',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  errorBannerText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  previewContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  avatarPreviewCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F8FAFC',
    borderWidth: 3,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 12,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewInitials: {
    fontSize: 40,
    fontWeight: '800',
    color: '#0F172A',
  },
  previewCaption: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  actionsContainer: {
    marginTop: 16,
  },
  buttonCol: {
    gap: 10,
  },
  buttonRow: {
    flexDirection: 'row',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 12,
  },
  secondaryBtnText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  dangerBtnText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
