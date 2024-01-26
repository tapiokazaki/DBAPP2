const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
// require('dotenv').config();

const app = express();
app.use(cors({origin:'http://localhost:5173'}));
app.use(express.json());

const port =3001;

const connection = mysql.createConnection({
  host:  '127.0.0.1',
  user: 'tapioka',
  password:  'tapiokazaki0604',
  database:  'todo'
});

// Todoリストの取得
app.get('/todos', (req, res) => {
  connection.query('SELECT * FROM todos', (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
    res.json(results);
  });
});

// Todoリストの追加
app.post('/todos', (req, res) => {
  const { task, group_id } = req.body;
  connection.query('INSERT INTO todos (task, group_id) VALUES (?, ?)', [task, group_id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error adding todo' });
    }
    const newTodo = { id: results.insertId, task, group_id };
    res.status(201).json(newTodo);
  });
});

// Add a new todo_group
app.post('/todo_groups', (req, res) => {
  const { name, description } = req.body;
  connection.query('INSERT INTO todo_groups (name, description) VALUES (?, ?)', [name, description], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error adding todo group' });
    }
    const newGroup = { id: results.insertId, name, description };
    res.status(201).json(newGroup);
  });
});

// Update a todo_group
app.put('/todo_groups/:id', (req, res) => {
  const groupId = req.params.id;
  const { name, description } = req.body;
  connection.query('UPDATE todo_groups SET name = ?, description = ? WHERE id = ?', [name, description, groupId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Internal Server Error' });
    }
    res.json({ message: 'Todo group updated successfully' });
  });
});

// // Delete a todo_group
// app.delete('/todo_groups/:id', (req, res) => {
//   const groupId = req.params.id;
//   connection.query('DELETE FROM todo_groups WHERE id = ?', [groupId], (err, results) => {
//     if (err) {
//       return res.status(500).json({ message: 'Internal Server Error' });
//     }
//     res.json({ message: 'Todo group deleted successfully' });
//   });
// });

// Get all todo_groups
app.get('/todo_groups', (req, res) => {
  connection.query('SELECT * FROM todo_groups', (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Internal Server Error' });
    }
    res.json(results);
  });
});

//Todoの削除
app.delete('/todos/:id', (req, res) => {
  const todoId = req.params.id;
  connection.query('DELETE FROM todos WHERE id = ?', [todoId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
    res.json({ message: 'Todo deleted successfully' });
  });
});

// Delete a todo_group and its related todos
app.delete('/todo_groups/:id', (req, res) => {
  const groupId = req.params.id;

  // トランザクションの開始
  connection.beginTransaction(err => {
    if (err) {
      console.error('Transaction start error:', err);
      return res.status(500).json({ message: 'Error starting transaction' });
    }

    // Step 1: Delete all todos associated with the group
    connection.query('DELETE FROM todos WHERE group_id = ?', [groupId], (err, results) => {
      if (err) {
        // トランザクションのロールバック
        connection.rollback(() => {
          console.error('Error deleting todos:', err);
          return res.status(500).json({ message: 'Error deleting todos' });
        });
        return;
      }

      // Step 2: Delete the group
      connection.query('DELETE FROM todo_groups WHERE id = ?', [groupId], (err, results) => {
        if (err) {
          // トランザクションのロールバック
          connection.rollback(() => {
            console.error('Error deleting todo group:', err);
            return res.status(500).json({ message: 'Error deleting todo group' });
          });
          return;
        }

        // トランザクションのコミット
        connection.commit(err => {
          if (err) {
            console.error('Transaction commit error:', err);
            connection.rollback(() => {
              return res.status(500).json({ message: 'Error committing transaction' });
            });
            return;
          }
          res.json({ message: 'Todo group deleted successfully' });
        });
      });
    });
  });
});


app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});



