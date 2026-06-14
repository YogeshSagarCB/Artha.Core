import { StyleSheet } from 'react-native';
import { Theme } from './colors';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background, padding: 15 },
    section: { backgroundColor: theme.surface, padding: 20, borderRadius: 16, marginBottom: 15, elevation: 2 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text_primary },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    input: { borderBottomWidth: 1, borderColor: theme.border, marginBottom: 15, padding: 8, fontSize: 16, color: theme.text_primary },
    inputLabel: { fontSize: 13, color: theme.text_secondary, fontWeight: 'bold', marginBottom: 5 },
    pickerContainer: { borderWidth: 1, borderColor: theme.border, borderRadius: 8, marginBottom: 15, backgroundColor: theme.surface },
    picker: { color: theme.text_primary },
    categoryInput: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    categoryList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    categoryTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.border, padding: 8, borderRadius: 20, paddingHorizontal: 12 },
    tagText: { marginRight: 5, color: theme.text_primary },
    addButton: { padding: 5 },
    addPatternButton: { backgroundColor: theme.primary + '20', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
    addPatternText: { color: theme.primary, fontWeight: 'bold' },
    patternCard: { borderBottomWidth: 1, borderColor: theme.border, paddingVertical: 12 },
    patternName: { fontWeight: 'bold', color: theme.text_primary },
    patternStr: { fontFamily: 'monospace', color: theme.text_secondary, fontSize: 12 },
    patternActions: { flexDirection: 'row', marginTop: 8 },
    editText: { color: '#4caf50', fontSize: 12, fontWeight: 'bold' },
    deleteText: { color: theme.expense, fontSize: 12, fontWeight: 'bold' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: theme.surface, padding: 25, borderRadius: 16, width: '90%' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: theme.text_primary },
    buttonSpacer: { height: 10 },
    widgetPermissionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, padding: 12, backgroundColor: theme.background, borderRadius: 10 },
    widgetToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    widgetLabel: { fontSize: 14, fontWeight: '600', color: theme.text_primary, marginBottom: 2 },
    widgetStatus: { fontSize: 12, fontWeight: 'bold' },
    widgetHint: { fontSize: 12, color: theme.text_secondary, lineHeight: 18, fontStyle: 'italic' },
    permissionButton: { backgroundColor: theme.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
    permissionButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  });
};
