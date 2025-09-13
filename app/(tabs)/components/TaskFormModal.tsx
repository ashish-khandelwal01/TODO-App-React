import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Task } from '../../_api/APIClient';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  initialData?: Task;
}

const TaskFormModal: React.FC<Props> = ({ visible, onClose, onSave, initialData }) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  useEffect(() => {
    setTitle(initialData?.title ?? '');
    setPriority(initialData?.priority ?? 'medium');
  }, [initialData, visible]);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ title, priority });
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.heading}>{initialData ? 'Edit Task' : 'New Task'}</Text>

          <TextInput
            placeholder="Title"
            placeholderTextColor="#999"
            style={styles.input}
            value={title}
            onChangeText={setTitle}
          />

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
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={{ color: '#fff' }}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text>Cancel</Text>
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
  heading: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    color: '#000', // ensures text is visible in production
    height: 40,
  },
  picker: { marginBottom: 12, height: 50, color: '#000' },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  saveBtn: { backgroundColor: '#007AFF', padding: 10, borderRadius: 8 },
  cancelBtn: { padding: 10, borderRadius: 8 },
});
