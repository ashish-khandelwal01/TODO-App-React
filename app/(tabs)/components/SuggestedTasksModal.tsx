import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import APIClient from '../../_api/APIClient';

interface SuggestedTaskWithPriority {
  title: string;
  priority: 'low' | 'medium' | 'high';
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onTaskSelected: (task: { title: string; description?: string; priority: 'low' | 'medium' | 'high' }) => void;
}

const SuggestedTasksModal: React.FC<Props> = ({ visible, onClose, onTaskSelected }) => {
  const [suggestedTasks, setSuggestedTasks] = useState<SuggestedTaskWithPriority[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      fetchSuggestedTasks();
    }
  }, [visible]);

  const fetchSuggestedTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await APIClient.getSuggestedTasks();
      console.log('Suggested tasks response:', response);
      
      // Convert string array to objects with default priority
      const tasksWithPriority: SuggestedTaskWithPriority[] = (response.suggested_tasks || []).map((taskTitle: string) => ({
        title: taskTitle,
        priority: 'medium' as const
      }));
      
      setSuggestedTasks(tasksWithPriority);
    } catch (error) {
      console.error('Error fetching suggested tasks:', error);
      setError('Failed to load suggested tasks');
      setSuggestedTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (task: SuggestedTaskWithPriority) => {
    try {
      // Create task - user authentication handled by backend token
      const response = await APIClient.createTask(task.title, task.priority);
      console.log('Task created successfully:', response);
      Alert.alert('Success', 'Task added to your list!');
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
      Alert.alert('Error', 'Failed to add task. Please try again.');
    }
  };

  const handlePriorityChange = (index: number, newPriority: 'low' | 'medium' | 'high') => {
    const updatedTasks = [...suggestedTasks];
    updatedTasks[index].priority = newPriority;
    setSuggestedTasks(updatedTasks);
  };

  const handleRetry = () => {
    fetchSuggestedTasks();
  };

  const renderPriorityButtons = (item: SuggestedTaskWithPriority, index: number) => {
    const priorities: Array<{ value: 'low' | 'medium' | 'high'; label: string; color: string }> = [
      { value: 'low', label: 'Low', color: '#28a745' },
      { value: 'medium', label: 'Med', color: '#ffc107' },
      { value: 'high', label: 'High', color: '#dc3545' }
    ];

    return (
      <View style={styles.priorityButtons}>
        {priorities.map((priority) => (
          <TouchableOpacity
            key={priority.value}
            style={[
              styles.priorityButton,
              item.priority === priority.value && styles.priorityButtonActive
            ]}
            onPress={() => handlePriorityChange(index, priority.value)}
          >
            <Text style={[
              styles.priorityButtonText,
              item.priority === priority.value && styles.priorityButtonTextActive
            ]}>
              {priority.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderTask = ({ item, index }: { item: SuggestedTaskWithPriority; index: number }) => (
    <View style={styles.taskItem}>
      <View style={styles.taskContent}>
        <Text style={styles.taskTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.priorityContainer}>
          <Text style={styles.priorityLabel}>Priority:</Text>
          {renderPriorityButtons(item, index)}
        </View>
      </View>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => handleAddTask(item)}
        activeOpacity={0.7}
      >
        <Text style={styles.addButtonText}>+ Add</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      {error ? (
        <>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.emptyText}>No suggested tasks available</Text>
      )}
    </View>
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
            <Text style={styles.heading}>Suggested Tasks</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Loading suggestions...</Text>
            </View>
          ) : (
            <FlatList
              data={suggestedTasks}
              keyExtractor={(item, index) => `suggestion-${index}-${item.title}`}
              renderItem={renderTask}
              style={styles.list}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={suggestedTasks.length === 0 ? styles.emptyList : styles.listContent}
              ListEmptyComponent={renderEmptyState}
            />
          )}

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default SuggestedTasksModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 5,
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
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  list: {
    maxHeight: 400,
  },
  listContent: {
    paddingBottom: 10,
  },
  emptyList: {
    flex: 1,
  },
  taskItem: {
    flexDirection: 'row',
    padding: 15,
    marginHorizontal: 15,
    marginVertical: 5,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  taskContent: {
    flex: 1,
    paddingRight: 10,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  priorityLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
    marginBottom: 4,
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  priorityButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 32,
    alignItems: 'center',
  },
  priorityButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  priorityButtonText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  priorityButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});