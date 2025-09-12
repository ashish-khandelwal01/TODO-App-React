import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView 
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import APIClient from '../../_api/APIClient';

interface Props {
  visible: boolean;
  onClose: () => void;
  onImportComplete: () => void; // Callback to refresh tasks after import
}

const ImportExportModal: React.FC<Props> = ({ visible, onClose, onImportComplete }) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [markdownText, setMarkdownText] = useState('');
  const [loading, setLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'markdown' | 'csv'>('json');

  const handleImportMarkdown = async () => {
    if (!markdownText.trim()) {
      Alert.alert('Error', 'Please enter some markdown content');
      return;
    }

    setLoading(true);
    try {
      await APIClient.importMarkdown(markdownText);
      Alert.alert('Success', 'Tasks imported successfully!');
      setMarkdownText('');
      onImportComplete();
      onClose();
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Error', 'Failed to import tasks. Please check your markdown format.');
    } finally {
      setLoading(false);
    }
  };

  const handleImportFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/*', 'application/json'],
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        setLoading(true);
        try {
          const content = await FileSystem.readAsStringAsync(result.uri);
          
          // Determine if it's JSON or markdown based on file extension or content
          const isJson = result.name?.toLowerCase().endsWith('.json') || 
                        (content.trim().startsWith('{') || content.trim().startsWith('['));
          
          if (isJson) {
            // Handle JSON import
            const jsonData = JSON.parse(content);
            // Assuming the API can handle JSON format as well
            await APIClient.importTasks(jsonData);
          } else {
            // Handle markdown import
            await APIClient.importMarkdown(content);
          }
          
          Alert.alert('Success', 'File imported successfully!');
          onImportComplete();
          onClose();
        } catch (parseError) {
          console.error('Parse error:', parseError);
          Alert.alert('Error', 'Failed to parse file content. Please check the format.');
        } finally {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('File picker error:', error);
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const handleExport = async () => {
  if (exportFormat !== 'markdown') {
    Alert.alert('Not Implemented', `${exportFormat.toUpperCase()} export is not available yet.`);
    return;
  }

  setLoading(true);
  try {
    const response = await APIClient.exportTasks();

    const content = response.content || '';
    const filename = response.filename || `tasks_${new Date().toISOString().split('T')[0]}.md`;
    const mimeType = response.content_type || 'text/markdown';

    if (!content.trim()) {
      Alert.alert('Error', 'No content received from server. Please try again.');
      return;
    }

    // Save to file system and share
    const fileUri = `${FileSystem.documentDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(fileUri, content);

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType,
        dialogTitle: `Export Tasks as ${exportFormat.toUpperCase()}`,
      });
    } else {
      Alert.alert('Success', `Tasks exported to ${filename}\n\nFile saved to device storage.`);
    }

    onClose();
  } catch (error: any) {
    console.error('Export error:', error);
    Alert.alert('Export Error', error.message || 'Failed to export tasks. Please try again.');
  } finally {
    setLoading(false);
  }
};


  const renderImportTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Import from Markdown</Text>
      <Text style={styles.helpText}>
        Paste your markdown content below. Use # for tasks and ## for subtasks.
      </Text>
      
      <TextInput
        style={styles.markdownInput}
        multiline
        placeholder="# Task 1&#10;Task description&#10;&#10;## Subtask 1&#10;Subtask description&#10;&#10;# Task 2&#10;Another task"
        value={markdownText}
        onChangeText={setMarkdownText}
        textAlignVertical="top"
        placeholderTextColor="#999"
      />

      <TouchableOpacity 
        style={[styles.actionButton, loading && styles.disabledButton]}
        onPress={handleImportMarkdown}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.actionButtonText}>Import from Text</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.orText}>OR</Text>

      <TouchableOpacity 
        style={[styles.actionButton, styles.secondaryButton, loading && styles.disabledSecondaryButton]}
        onPress={handleImportFile}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#007AFF" size="small" />
        ) : (
          <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
            📁 Import from File
          </Text>
        )}
      </TouchableOpacity>

      <Text style={styles.supportedFormats}>
        Supported formats: .md, .txt, .json
      </Text>
    </ScrollView>
  );

  const renderExportTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Export Tasks</Text>
      <Text style={styles.helpText}>
        Choose a format to export your tasks:
      </Text>

      <View style={styles.formatOptions}>
        {[
          { key: 'json', label: 'JSON', desc: 'Machine readable' },
          { key: 'markdown', label: 'Markdown', desc: 'Human readable' },
          { key: 'csv', label: 'CSV', desc: 'Spreadsheet format' }
        ].map((format) => (
          <TouchableOpacity
            key={format.key}
            style={[
              styles.formatOption,
              exportFormat === format.key && styles.formatOptionActive
            ]}
            onPress={() => setExportFormat(format.key as any)}
          >
            <Text style={[
              styles.formatOptionText,
              exportFormat === format.key && styles.formatOptionTextActive
            ]}>
              {format.label}
            </Text>
            <Text style={[
              styles.formatOptionDesc,
              exportFormat === format.key && styles.formatOptionDescActive
            ]}>
              {format.desc}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity 
        style={[styles.actionButton, loading && styles.disabledButton]}
        onPress={handleExport}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.actionButtonText}>Export Tasks</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.heading}>Import / Export</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'import' && styles.tabActive]}
              onPress={() => setActiveTab('import')}
            >
              <Text style={[styles.tabText, activeTab === 'import' && styles.tabTextActive]}>
                Import
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'export' && styles.tabActive]}
              onPress={() => setActiveTab('export')}
            >
              <Text style={[styles.tabText, activeTab === 'export' && styles.tabTextActive]}>
                Export
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'import' ? renderImportTab() : renderExportTab()}
        </View>
      </View>
    </Modal>
  );
};

export default ImportExportModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '95%',
    maxHeight: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    backgroundColor: '#f5f5f5',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabContent: {
    padding: 20,
    maxHeight: 400,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  markdownInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    height: 150,
    fontSize: 14,
    marginBottom: 15,
    backgroundColor: '#f8f9fa',
    color: '#333',
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  disabledSecondaryButton: {
    borderColor: '#ccc',
  },
  orText: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 10,
    fontSize: 14,
    fontWeight: '500',
  },
  supportedFormats: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 10,
    fontStyle: 'italic',
  },
  formatOptions: {
    marginBottom: 20,
  },
  formatOption: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  formatOptionActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  formatOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginBottom: 2,
  },
  formatOptionTextActive: {
    color: '#fff',
  },
  formatOptionDesc: {
    fontSize: 12,
    color: '#666',
  },
  formatOptionDescActive: {
    color: 'rgba(255,255,255,0.8)',
  },
});