import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [todos, setTodos] = useState([]);
  const [groups, setGroups] = useState([]);
  const [groupName, setGroupName] = useState([]);
  const [discription, setDiscription] = useState([]);
  const [groupTasks, setGroupTasks] = useState({});
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteButtons, setShowDeleteButtons] = useState(false);
  const [groupDeleteModes, setGroupDeleteModes] = useState({}); // 各グループの削除モードの状態



  useEffect(() => {
    fetch('http://localhost:3001/todos')
      .then(response => response.json())
      .then(data => setTodos(data));

    fetch('http://localhost:3001/todo_groups')
      .then(response => response.json())
      .then(data => setGroups(data));
  }, []);

  // グループの削除モードを切り替える関数
  const toggleGroupDeleteMode = (groupId) => {
    setGroupDeleteModes(prevModes => ({
      ...prevModes,
      [groupId]: !prevModes[groupId]
    }));
  };

  const toggleTodoCompletion = (todoId) => {
    // 完了状態のトグル
    const updatedTodos = todos.map(todo =>
      todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
    );
    setTodos(updatedTodos);
  };

  const addGroup = () => {
    fetch('http://localhost:3001/todo_groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: groupName })//discription:'hello'
    })
      .then(response => response.json())
      .then(newGroup => {
        setGroups([...groups, newGroup]);
        setGroupName('');
        setDiscription('');
        // 新しいグループに対する空のタスクを設定
        setGroupTasks(prev => ({ ...prev, [newGroup.id]: '' }));
      });
  };

  const deleteGroup = (groupId) => {
    fetch(`http://localhost:3001/todo_groups/${groupId}`, {
      method: 'DELETE',
    })
      .then(response => {
        if (response.ok) {
          // 該当するグループに属するTodoも削除
          setTodos(todos.filter(todo => todo.group_id !== groupId));
          // グループリストから該当するグループを削除
          setGroups(groups.filter(group => group.id !== groupId));
        } else {
          // エラーハンドリング
          console.error('Failed to delete the group');
        }
      })
      .catch(error => {
        console.error('Error:', error);
      });
  };

  const handleGroupTaskChange = (groupId, task) => {
    setGroupTasks(prev => ({ ...prev, [groupId]: task }));
  };

  const addTodoToGroup = (groupId) => {
    const task = groupTasks[groupId] || '';
    if (!task) {
      alert('タスクを入力してください');
      return;
    } 
    fetch('http://localhost:3001/todos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ task, group_id: groupId })
    })
      .then(response => response.json())
      .then(newTodo => {
        setTodos([...todos, newTodo]);
        setGroupTasks(prev => ({ ...prev, [groupId]: '' }));
      });
  };

  const deleteTodo = (todoId) => {
    console.log(todoId)
    fetch(`http://localhost:3001/todos/${todoId}`, {
      method: 'DELETE',
    })
    .then(response => {
      if (response.ok) {
        // Todoが正常に削除された場合、フロントエンドのステートを更新
        setTodos(todos.filter(todo => todo.id !== todoId));
      } else {
        console.error('Failed to delete todo');
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
  };

  return (
    <div>
      <h1>My ToDo</h1>

      <text className="settings-button" onClick={() => setShowSettings(!showSettings)}>
        設定
      </text>
      {showSettings && (
        <div className="settings-panel">
          <label>
            <input
              type="checkbox"
              className="settings-checkbox"
              checked={showDeleteButtons}
              onChange={() => setShowDeleteButtons(!showDeleteButtons)}
            />
            グループの削除ボタンを表示
          </label>
        </div>
      )}

      <div className="group-add-section">
        <input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="グループ名"
        />
        <button onClick={addGroup}>TODOグループ追加</button>
      </div>

      <div className="group-list">
        {groups.map(group => (
          <div key={group.id} className="group-box">
            <div className="group-header">
              {/* 削除ボタン */}
              {showDeleteButtons && (
                <button className='group-delete-button' onClick={() => deleteGroup(group.id)}>削除</button>
              )}
              <h3>{group.name}</h3>
              <button style={{ backgroundColor: groupDeleteModes[group.id] ? 'red':''}}  className='toggle-delete-mode-button' onClick={() => toggleGroupDeleteMode(group.id)}>
                {groupDeleteModes[group.id] ? 'TODO削除ON': 'TODO削除OFF'}

              </button>
            </div>
            
            <input
              type="text"
              className="todo-input"
              value={groupTasks[group.id] || ''}
              onChange={(e) => handleGroupTaskChange(group.id, e.target.value)}
              placeholder="新しいTodoを追加"
            />
            <button className='add-todo-button' onClick={() => addTodoToGroup(group.id)}>追加</button>
            <ul>
              {todos.filter(todo => todo.group_id === group.id).map(todo => (
                <li key={todo.id} className="todo-item">
                  <input
                    type="checkbox"
                    className="todo-checkbox"
                    checked={todo.completed || false}
                    onChange={() => toggleTodoCompletion(todo.id)}
                  />
                  {groupDeleteModes[group.id] && (
                    <button className='todo-delete-button' onClick={() => {
                      // console.log(todo.id) ;
                      deleteTodo(todo.id);
                      // console.log("click");
                    }}>削除</button>
                  )}
                  {todo.task}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
