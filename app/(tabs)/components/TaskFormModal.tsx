import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Task } from '../../_api/APIClient';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  initialData?: Task;
}

const priorityMap: Record<number, { label: string; color: string }> = {
  1: { label: 'Low', color: '#28a745' },
  2: { label: 'Medium', color: '#ffc107' },
  3: { label: 'High', color: '#dc3545' },
};

const MAX_TITLE_LENGTH = 100;

const TaskFormModal: React.FC<Props> = ({ visible, onClose, onSave, initialData }) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('low');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (title.length > MAX_TITLE_LENGTH) {
      const truncated = title.substring(0, MAX_TITLE_LENGTH);
      setTitle(truncated);
      if (inputRef.current) {
        inputRef.current.setNativeProps({ text: truncated });
      }
    }
  }, [title]);

  useEffect(() => {
    let initialTitle = initialData?.title ?? '';

    if (initialTitle.length > MAX_TITLE_LENGTH) {
      initialTitle = Array.from(initialTitle).slice(0, MAX_TITLE_LENGTH).join('');
    }

    setTitle(initialTitle);

    if (initialData?.priority) {
      const priorityLabel = priorityMap[initialData.priority]?.label.toLowerCase() as 'low' | 'medium' | 'high' | undefined;
      if (priorityLabel) {
        setPriority(priorityLabel);
      } else {
        setPriority('low');
      }
    } else {
      setPriority('low');
    }
  }, [initialData, visible]);

  const handleTitleChange = (text: string) => {
    if (text.length <= MAX_TITLE_LENGTH) {
      setTitle(text);
    } else {
      const truncated = text.substring(0, MAX_TITLE_LENGTH);
      setTitle(truncated);

      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setNativeProps({ text: truncated });
        }
      }, 0);
    }
  };

  const handleSave = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || trimmedTitle.length === 0) return;

    if (trimmedTitle.length > MAX_TITLE_LENGTH) {
      setTitle(trimmedTitle.slice(0, MAX_TITLE_LENGTH));
      return;
    }

    onSave({ title: trimmedTitle, priority });
    onClose();
  };

  const remainingChars = MAX_TITLE_LENGTH - title.length;
  const isAtLimit = remainingChars === 0;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.heading}>{initialData ? 'Edit Task' : 'New Task'}</Text>

          <View style={styles.inputContainer}>
            <TextInput
              ref={inputRef}
              placeholder="Title"
              placeholderTextColor="#999"
              style={[styles.input, isAtLimit && styles.inputAtLimit]}
              value={title}
              onChangeText={handleTitleChange}
              multiline={false}
              returnKeyType="done"
              onEndEditing={(e) => {
                if (e.nativeEvent.text.length > MAX_TITLE_LENGTH) {
                  const truncated = e.nativeEvent.text.substring(0, MAX_TITLE_LENGTH);
                  setTitle(truncated);
                  if (inputRef.current) {
                    inputRef.current.setNativeProps({ text: truncated });
                  }
                }
              }}
            />
            <Text style={[styles.charCounter, isAtLimit && styles.charCounterAtLimit]}>
              {title.length}/{MAX_TITLE_LENGTH}
            </Text>
          </View>

          <Picker
            selectedValue={priority}
            onValueChange={(v) => setPriority(v as 'low' | 'medium' | 'high')}
            style={styles.picker}
            dropdownIconColor="#000"
          >
            <Picker.Item label="Low" value="low" color="#000" />
            <Picker.Item label="Medium" value="medium" color="#000" />
            <Picker.Item label="High" value="high" color="#000" />
          </Picker>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.saveBtn, !title.trim() && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!title.trim()}
            >
              <Text style={[styles.saveBtnText, !title.trim() && styles.saveBtnTextDisabled]}>
                Save
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default TaskFormModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#000',
  },
  inputContainer: {
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 8,
    color: '#000',
    height: 40,
    marginBottom: 4,
  },
  inputAtLimit: {
    borderColor: '#dc3545',
  },
  charCounter: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  charCounterAtLimit: {
    color: '#dc3545',
    fontWeight: '600',
  },
  picker: {
    marginBottom: 12,
    color: '#000',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveBtn: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
  },
  saveBtnDisabled: {
    backgroundColor: '#ccc',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  saveBtnTextDisabled: {
    color: '#999',
  },
  cancelBtn: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  cancelBtnText: {
    color: '#000',
  },
});