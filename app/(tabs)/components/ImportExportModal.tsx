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
        type: 'text/*',
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        setLoading(true);
        const content = await FileSystem.readAsStringAsync(result.uri);
        
        try {
          await APIClient.importMarkdown(content);
          Alert.alert('Success', 'File imported successfully!');
          onImportComplete();
          onClose();
        } catch (error) {
          console.error('Import error:', error);
          Alert.alert('Error', 'Failed to import file. Please check the format.');
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
    setLoading(true);
    try {
      const response = await APIClient.exportTasks(exportFormat);
      
      let content = '';
      let filename = '';
      let mimeType = '';

      switch (exportFormat) {
        case 'json':
          content = JSON.stringify(response.tasks, null, 2);
          filename = 'tasks.json';
          mimeType = 'application/json';
          break;
        case 'markdown':
          content = response.markdown || '';
          filename = 'tasks.md';
          mimeType = 'text/markdown';
          break;
        case 'csv':
          content = response.csv || '';
          filename = 'tasks.csv';
          mimeType = 'text/csv';
          break;
      }

      // Save to file system and share
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, content);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Success', `Tasks exported to ${filename}`);
      }

      onClose();
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export tasks');
    } finally {
      setLoading(false);
    }
  };

  const renderImportTab = () => (
    <ScrollView style={styles.tabContent}>
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
      />

      <TouchableOpacity 
        style={styles.actionButton}
        onPress={handleImportMarkdown}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.actionButtonText}>Import from Text</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.orText}>OR</Text>

      <TouchableOpacity 
        style={[styles.actionButton, styles.secondaryButton]}
        onPress={handleImportFile}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#007AFF" />
        ) : (
          <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
            Import from File
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  const renderExportTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Export Tasks</Text>
      <Text style={styles.helpText}>
        Choose a format to export your tasks:
      </Text>

      <View style={styles.formatOptions}>
        {['json', 'markdown', 'csv'].map((format) => (
          <TouchableOpacity
            key={format}
            style={[
              styles.formatOption,
              exportFormat === format && styles.formatOptionActive
            ]}
            onPress={() => setExportFormat(format as any)}
          >
            <Text style={[
              styles.formatOptionText,
              exportFormat === format && styles.formatOptionTextActive
            ]}>
              {format.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity 
        style={styles.actionButton}
        onPress={handleExport}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.actionButtonText}>Export Tasks</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
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
  },
  closeButtonText: {
    fontSize: 24,
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
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
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
  orText: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 10,
    fontSize: 14,
  },
  formatOptions: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  formatOption: {
    flex: 1,
    padding: 10,
    margin: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  formatOptionActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  formatOptionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  formatOptionTextActive: {
    color: '#fff',
  },
});