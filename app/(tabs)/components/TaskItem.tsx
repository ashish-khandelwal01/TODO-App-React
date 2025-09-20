import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Task } from '../../_api/APIClient';

interface Props {
  task: Task;
  onDelete: (id: number) => void;
  onUpdate: (task: Task) => void;
  onComplete: (id: number) => void;
  onPress?: () => void;
  showSubtaskCount?: boolean;
}

const TaskItem: React.FC<Props> = ({ 
  task, 
  onDelete, 
  onUpdate, 
  onComplete, 
  onPress,
  showSubtaskCount = false 
}) => {
  // Keep numeric priority mapping as-is
  const priorityMap: Record<number, { label: string; color: string }> = {
    1: { label: 'Low', color: '#28a745' },
    2: { label: 'Medium', color: '#ffc107' },
    3: { label: 'High', color: '#dc3545' },
  };
  const priority = priorityMap[task.priority] || { label: 'Unknown', color: '#000' };

  return (
    <TouchableOpacity
      style={[styles.container, task.completed && styles.completed]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{task.title}</Text>
        <Text style={[styles.priority, { color: priority.color }]}>
          Priority: {priority.label}
        </Text>
        {showSubtaskCount && task.subtask_count > 0 && (
          <Text style={styles.subtaskCount}>
            {task.subtask_count} subtask{task.subtask_count > 1 ? 's' : ''}
          </Text>
        )}
        {task.completion_percentage !== undefined && task.subtask_count > 0 && (
          <Text style={styles.progress}>
            Progress: {task.completion_percentage}%
          </Text>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          onPress={(e) => {
            e.stopPropagation();
            onComplete(task.id);
          }} 
          style={styles.btn}
        >
          <Text style={[styles.btnText, { color: task.completed ? '#ffc107' : '#28a745' }]}>
            {task.completed ? 'Undo' : 'Done'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={(e) => {
            e.stopPropagation();
            onUpdate(task);
          }} 
          style={styles.btn}
        >
          <Text style={styles.btnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }} 
          style={styles.btn}
        >
          <Text style={[styles.btnText, { color: '#dc3545' }]}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Show arrow indicator if task has subtasks and onPress is provided */}
      {onPress && task.subtask_count > 0 && (
        <View style={styles.arrow}>
          <Text style={styles.arrowText}>→</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default TaskItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  completed: {
    opacity: 0.6,
  },
  title: {
    fontWeight: '700',
    fontSize: 16,
    color: '#111',
  },
  desc: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  priority: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },
  subtaskCount: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
    fontWeight: '600',
  },
  progress: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  actions: {
    justifyContent: 'space-around',
    marginLeft: 12,
  },
  btn: {
    marginVertical: 2,
  },
  btnText: {
    fontSize: 15,
    color: '#007AFF',
  },
  arrow: {
    marginLeft: 8,
    paddingHorizontal: 4,
  },
  arrowText: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: 'bold',
  },
});