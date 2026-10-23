// Purpose: Modal allowing users to configure export filters, generate a personal ledger PDF, and save/share using native device capabilities.
// Imported by: src/features/account/AccountScreen.tsx

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { exportLedgerPdfApi, ExportLedgerPdfOptions } from '../api/ledger.api';
import { FilePdfIcon, CheckIcon } from './Icons';
import { Theme } from '../theme/index';

interface ExportPdfModalProps {
  visible: boolean;
  onClose: () => void;
  onExportSuccess: (filename: string, recordCount: number) => void;
}

type DirectionFilter = 'ALL' | 'LENT' | 'BORROWED';
type StatusFilter = 'ALL' | 'OUTSTANDING' | 'OVERDUE' | 'REPAID';
type DateRangeFilter = 'ALL_TIME' | 'LAST_30_DAYS' | 'LAST_90_DAYS' | 'THIS_YEAR';

export function ExportPdfModal({
  visible,
  onClose,
  onExportSuccess,
}: ExportPdfModalProps) {
  const [direction, setDirection] = useState<DirectionFilter>('ALL');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [dateRange, setDateRange] = useState<DateRangeFilter>('ALL_TIME');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const calculateDateBounds = (range: DateRangeFilter): { startDate?: string; endDate?: string } => {
    const now = new Date();
    if (range === 'ALL_TIME') {
      return {};
    }
    if (range === 'LAST_30_DAYS') {
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { startDate: past.toISOString().slice(0, 10) };
    }
    if (range === 'LAST_90_DAYS') {
      const past = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      return { startDate: past.toISOString().slice(0, 10) };
    }
    if (range === 'THIS_YEAR') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return { startDate: startOfYear.toISOString().slice(0, 10) };
    }
    return {};
  };

  const handleGeneratePdf = async () => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const { startDate, endDate } = calculateDateBounds(dateRange);

      const options: ExportLedgerPdfOptions = {
        direction,
        status,
        startDate,
        endDate,
        format: 'base64',
      };

      const response = await exportLedgerPdfApi(options);

      if (!response.base64) {
        throw new Error('Server did not return a valid PDF statement buffer.');
      }

      if (Platform.OS === 'web') {
        // Trigger direct browser download for web platform
        if (typeof document !== 'undefined') {
          const link = document.createElement('a');
          link.href = `data:application/pdf;base64,${response.base64}`;
          link.download = response.filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        // Write base64 to mobile cache directory
        const cacheDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
        const fileUri = `${cacheDir}${response.filename}`;

        await FileSystem.writeAsStringAsync(fileUri, response.base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Safely invoke native device share dialog without failing if dismissed
        try {
          const isShareAvailable = await Sharing.isAvailableAsync();
          if (isShareAvailable) {
            await Sharing.shareAsync(fileUri, {
              mimeType: 'application/pdf',
              dialogTitle: 'MiniLedger Personal Loan Statement',
              UTI: 'com.adobe.pdf',
            });
          }
        } catch (shareErr) {
          console.warn('Native sharing dialog was dismissed or encountered an issue:', shareErr);
        }
      }

      onExportSuccess(response.filename, response.recordCount);
      onClose();
    } catch (err: any) {
      console.error('PDF Export Error:', err);
      setErrorMessage(err.message || 'Failed to generate PDF statement. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
              <Text style={styles.headerKicker}>PORTABILITY & AUDIT</Text>
              <Text style={styles.headerTitle}>Export Ledger as PDF</Text>
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

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Section 1: Direction Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionLabel}>LOAN DIRECTION</Text>
              <View style={styles.chipsRow}>
                <TouchableOpacity
                  style={[styles.chip, direction === 'ALL' && styles.chipActive]}
                  onPress={() => setDirection('ALL')}
                >
                  <Text style={[styles.chipText, direction === 'ALL' && styles.chipTextActive]}>
                    All Directions
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.chip, direction === 'LENT' && styles.chipActive]}
                  onPress={() => setDirection('LENT')}
                >
                  <Text style={[styles.chipText, direction === 'LENT' && styles.chipTextActive]}>
                    Lent (Receivables)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.chip, direction === 'BORROWED' && styles.chipActive]}
                  onPress={() => setDirection('BORROWED')}
                >
                  <Text style={[styles.chipText, direction === 'BORROWED' && styles.chipTextActive]}>
                    Borrowed (Payables)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Section 2: Status Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionLabel}>STATUS</Text>
              <View style={styles.chipsRow}>
                <TouchableOpacity
                  style={[styles.chip, status === 'ALL' && styles.chipActive]}
                  onPress={() => setStatus('ALL')}
                >
                  <Text style={[styles.chipText, status === 'ALL' && styles.chipTextActive]}>
                    All Statuses
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.chip, status === 'OUTSTANDING' && styles.chipActive]}
                  onPress={() => setStatus('OUTSTANDING')}
                >
                  <Text style={[styles.chipText, status === 'OUTSTANDING' && styles.chipTextActive]}>
                    Outstanding
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.chip, status === 'OVERDUE' && styles.chipActive]}
                  onPress={() => setStatus('OVERDUE')}
                >
                  <Text style={[styles.chipText, status === 'OVERDUE' && styles.chipTextActive]}>
                    Overdue Only
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.chip, status === 'REPAID' && styles.chipActive]}
                  onPress={() => setStatus('REPAID')}
                >
                  <Text style={[styles.chipText, status === 'REPAID' && styles.chipTextActive]}>
                    Repaid / Settled
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Section 3: Date Range */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionLabel}>TIME PERIOD</Text>
              <View style={styles.chipsRow}>
                <TouchableOpacity
                  style={[styles.chip, dateRange === 'ALL_TIME' && styles.chipActive]}
                  onPress={() => setDateRange('ALL_TIME')}
                >
                  <Text style={[styles.chipText, dateRange === 'ALL_TIME' && styles.chipTextActive]}>
                    All Time
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.chip, dateRange === 'LAST_30_DAYS' && styles.chipActive]}
                  onPress={() => setDateRange('LAST_30_DAYS')}
                >
                  <Text style={[styles.chipText, dateRange === 'LAST_30_DAYS' && styles.chipTextActive]}>
                    Last 30 Days
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.chip, dateRange === 'LAST_90_DAYS' && styles.chipActive]}
                  onPress={() => setDateRange('LAST_90_DAYS')}
                >
                  <Text style={[styles.chipText, dateRange === 'LAST_90_DAYS' && styles.chipTextActive]}>
                    Last 90 Days
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.chip, dateRange === 'THIS_YEAR' && styles.chipActive]}
                  onPress={() => setDateRange('THIS_YEAR')}
                >
                  <Text style={[styles.chipText, dateRange === 'THIS_YEAR' && styles.chipTextActive]}>
                    This Year
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Statement Preview Info Card */}
            <View style={styles.infoBox}>
              <View style={styles.infoIconCol}>
                <FilePdfIcon size={18} color="#0F172A" />
              </View>
              <View style={styles.infoTextCol}>
                <Text style={styles.infoTitle}>Bank-Statement Quality PDF</Text>
                <Text style={styles.infoSubtitle}>
                  Includes account holder details, gross financial summaries, and a complete ledger table with caller-relative perspectives.
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.generateBtn, isLoading && styles.btnDisabled]}
                onPress={handleGeneratePdf}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.generateBtnText}>Generate & Share PDF</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
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
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.xl,
    padding: 20,
    ...Theme.shadows.card,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.borderSubtle,
  },
  headerKicker: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.textMuted,
    letterSpacing: 0.6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginTop: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Theme.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: Theme.borderRadius.md,
    padding: 10,
    marginBottom: 12,
  },
  errorBannerText: {
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 4,
  },
  filterSection: {
    marginBottom: 14,
  },
  filterSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1,
    borderColor: Theme.colors.borderSubtle,
    backgroundColor: '#F8FAFC',
  },
  chipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Theme.borderRadius.lg,
    padding: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  infoIconCol: {
    marginTop: 2,
  },
  infoTextCol: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  infoSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  generateBtn: {
    flex: 2,
    height: 44,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.sm,
  },
  generateBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
