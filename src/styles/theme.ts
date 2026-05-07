import { StyleSheet } from 'react-native';

export const colors = {
  primary: '#6C63FF',
  primaryDark: '#5A52D5',
  secondary: '#FF6584',
  background: '#F8F9FF',
  surface: '#FFFFFF',
  text: '#1A1A2E',
  textMuted: '#9E9E9E',
  border: '#E8E8F0',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
};

export const commonStyles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
    marginBottom: 14,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonOutline: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonOutlineText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  screenPadding: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
});
