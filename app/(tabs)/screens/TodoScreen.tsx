import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import APIClient, { Task, SuggestedTask } from '../../_api/APIClient';
import TaskItem from '../components/TaskItem';
import TaskFormModal from '../components/TaskFormModal';
import SuggestedTasksModal from '../components/SuggestedTasksModal';
import ImportExportModal from '../components/ImportExportModal';
import { useAuth } from '../../_contexts/AuthContext';

interface Props {
  navigation: any;
}

const TodoScreen: React.FC<Props> = ({ navigation }) => {
  const { logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [suggestedModalVisible, setSuggestedModalVisible] = useState(false);
  const [importExportModalVisible, setImportExportModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTasks = async () => {
    try {
      const response = await APIClient.getTasks();
      // Filter to show only parent tasks (depth = 0 or is_subtask = false)
      const parentTasks = (response.tasks || []).filter(task => !task.is_subtask);
      setTasks(parentTasks);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSave = async (taskData: Partial<Task>) => {
    try {
      if (editingTask) {
        await APIClient.updateTask(editingTask.id, taskData);
      } else {
        await APIClient.createTask(
          taskData.title!,
          taskData.priority,
          taskData.parent_task_id,
          taskData.depth
        );
      }
      fetchTasks();
      setModalVisible(false);
      setEditingTask(undefined);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (taskId: number) => {
    await APIClient.deleteTask(taskId);
    fetchTasks();
  };

  const handleComplete = async (taskId: number) => {
    await APIClient.completeTask(taskId);
    fetchTasks();
  };

  const handleTaskPress = (task: Task) => {
    if (task.subtask_count > 0) {
      navigation.navigate('SubTaskScreen', { task });
    }
  };

  const handleImportComplete = () => {
    fetchTasks(); // Refresh tasks after import
  };

  const renderPlaceholder = () => (
    <View style={styles.placeholder}>
      <View style={styles.placeholderTitle} />
      <View style={styles.placeholderDesc} />
    </View>
  );

  const HeaderComponent = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.header}>Todo List</Text>
      <View style={styles.headerButtons}>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={() => setImportExportModalVisible(true)}
        >
          <Text style={styles.headerButtonText}>⚙️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <FlatList
          data={[1, 2, 3, 4, 5]}
          keyExtractor={(item) => item.toString()}
          renderItem={renderPlaceholder}
          ListHeaderComponent={<HeaderComponent />}
          contentContainerStyle={styles.listContent}
        />
      ) : tasks.length === 0 ? (
        <View style={styles.container}>
          <HeaderComponent />
          <View style={styles.noTasks}>
            <Text style={styles.noTasksText}>No tasks yet</Text>
            <TouchableOpacity 
              style={styles.suggestedButton}
              onPress={() => setSuggestedModalVisible(true)}
            >
              <Text style={styles.suggestedButtonText}>💡 Get Suggestions</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TaskItem
              task={item}
              onDelete={handleDelete}
              onUpdate={(t) => {
                setEditingTask(t);
                setModalVisible(true);
              }}
              onComplete={handleComplete}
              onPress={() => handleTaskPress(item)}
              showSubtaskCount={true}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchTasks();
              }}
            />
          }
          ListHeaderComponent={<HeaderComponent />}
          contentContainerStyle={styles.listContent}
        />
      )}

      <View style={styles.bottomContainer}>
        <View style={styles.bottomButtons}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.suggestedBtn]}
            onPress={() => setSuggestedModalVisible(true)}
          >
            <Text style={styles.actionBtnText}>💡 Suggestions</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionBtn, styles.addBtn]}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.actionBtnText}>+ Add Task</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TaskFormModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingTask(undefined);
        }}
        onSave={handleSave}
        initialData={editingTask}
      />

      <SuggestedTasksModal
        visible={suggestedModalVisible}
        onClose={() => {
          setSuggestedModalVisible(false);
          fetchTasks();
        }}
        onTaskSelected={() => {}} 
      />

      <ImportExportModal
        visible={importExportModalVisible}
        onClose={() => setImportExportModalVisible(false)}
        onImportComplete={handleImportComplete}
      />
    </View>
  );
};

export default TodoScreen;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f0f2f5' 
  },

  // Header with logout button and settings
  headerContainer: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 4,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginRight: 80, // Account for header buttons width
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  headerButtonText: {
    fontSize: 16,
  },
  logoutBtn: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 3,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Content area
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 100, // Space for bottom buttons
  },

  // Bottom button area
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f0f2f5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 5,
    elevation: 5,
  },
  bottomButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 5,
  },
  addBtn: {
    backgroundColor: '#28A745',
  },
  suggestedBtn: {
    backgroundColor: '#FFC107',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Placeholder styles
  placeholder: {
    backgroundColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  placeholderTitle: {
    height: 16,
    width: '60%',
    backgroundColor: '#bbb',
    borderRadius: 6,
    marginBottom: 6,
  },
  placeholderDesc: {
    height: 12,
    width: '80%',
    backgroundColor: '#ccc',
    borderRadius: 6,
  },

  // No tasks state
  noTasks: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100, // Account for bottom buttons
  },
  noTasksText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
    marginBottom: 20,
  },
  suggestedButton: {
    backgroundColor: '#FFC107',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  suggestedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});