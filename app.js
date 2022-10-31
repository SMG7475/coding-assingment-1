const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
const inValidScenarios = (request, response, next) => {
    const {
    status = "",
    priority = "",
    category = "",
    date=""
  } = request.query;
  const statusValueList=[TO DO,IN PROGRESS,DONE];
  const priorityValueList=[HIGH,MEDIUM,LOW];
  const categoryValueList=[WORK,HOME,LEARNING];
  if (!statusValueList.includes(status)){
    response.status(400);
    response.send("Invalid Todo Status");
  }
  else if (!priorityValueList.includes(priority)){
      response.status(400);
      response.send("Invalid Todo Priority");
  }
  else if (!categoryValueList.includes(category)){
      response.status(400);
      response.send("Invalid Todo Category");
  }
  else if (!isValid(new Date(date))){
      response.status(400);
      response.send("Invalid Due Date");
  }
  else{
      next();
  }
};
//API 1
app.get(`/todos/`,inValidScenarios, async (request, response) => {
  const {
    status = "",
    priority = "",
    search_q = "",
    category = "",
  } = request.query;
  const getTodosQuery = `
    SELECT 
    id,
    todo,
    priority,
    status,
    category,
    due_date as dueDate
    FROM todo
    WHERE todo LIKE '%${search_q}%'
    AND priority LIKE '%${priority}%'
    AND status LIKE '%${status}%'
    AND category LIKE '%${category}%';
    `;
  const getTodosArray = await db.all(getTodosQuery);
  response.send(getTodosArray);
});
//API 2
app.get("/todos/:todoId/",inValidScenarios, async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
  SELECT 
    id,
    todo,
    priority,
    status,
    category,
    due_date as dueDate
  FROM todo
  WHERE id=${todoId};
  `;
  const getTodo = await db.get(getTodoQuery);
  response.send(getTodo);
});
//API3
app.get("/agenda/?date=:date",inValidScenarios, async (request, response) => {
  const { date } = request.query;
  const newDate = format(new Date(date), "yyyy-MM-dd");
  const getTodosAgendaQuery = `
    SELECT 
    id,
    todo,
    priority,
    status,
    category,
    due_date as dueDate
    FROM todo
    WHERE due_date =${newDate};`;
  const getTodosAgendaArray = await db.all(getTodosAgendaQuery);
  response.send(getTodosAgendaArray);
});
//API 4
app.post("/todos/",inValidScenarios, async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const postTodoQuery = `
    INSERT INTO todo(id,todo,priority,status,category,due_date)
    VALUES(${id},'${todo}','${priority}','${status}', '${category}', '${dueDate}');
    `;
  const postTodo = await db.run(postTodoQuery);
  response.send("Todo Successfully Added");
});
//API 5
app.put("/todos/:todoId/",inValidScenarios, async (request, response) => {
  const { todoId } = request.params;
  let updateColumn;
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      break;
  }
  const previousTodoQuery = `
    SELECT * 
    FROM todo
    WHERE id= ${todoId} ;`;
  const prevTodo = await db.get(previousTodoQuery);

  const {
    todo = prevTodo.todo,
    priority = prevTodo.priority,
    status = prevTodo.status,
    category = prevTodo.category,
    dueDate = prevTodo.due_date,
  } = request.body;
  const updateTodoQuery = `
    UPDATE
      todo
      SET
      todo='${todo}',
      priority='${priority}',
      status='${status}',
      category='${category}',
      due_date='${dueDate}'
       WHERE
       id=${todoId};`;
  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});
//API 6
app.delete("/todos/:todoId/",inValidScenarios, async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM todo
    WHERE id=${todoId};
    `;
  const deleteTodo = await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
module.exports = app;
