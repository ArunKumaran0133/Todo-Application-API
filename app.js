const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let dataBase = null;

const initializeServerAndDataBase = async () => {
  try {
    dataBase = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started...");
    });
  } catch (error) {
    console.log(`Server Get An Error ${error}`);
    process.exit(1);
  }
};

initializeServerAndDataBase();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperties = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperties = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
        SELECT *
        FROM todo
        WHERE todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
      break;
    case hasPriorityProperties(request.query):
      getTodosQuery = `
            SELECT *
            FROM todo
            WHERE todo LIKE '%${search_q}%'
            AND priority = '${priority}';`;
      break;
    case hasStatusProperties(request.query):
      getTodosQuery = `
            SELECT *
            FROM todo 
            WHERE todo LIKE '%${search_q}%'
            AND status = '${status}';
        `;
      break;
    default:
      getTodosQuery = `
                SELECT *
                FROM todo
                WHERE todo LIKE '%${search_q}%';`;
  }
  data = await dataBase.all(getTodosQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `
        SELECT *
        FROM todo 
        WHERE id = ${todoId};
    `;
  const todo = await dataBase.get(getTodoQuery);
  response.send(todo);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postTodoQuery = `
        INSERT INTO 
            todo (id , todo , priority , status)
        VALUES (${id} , '${todo}' , '${priority}' , '${status}');
    `;
  await dataBase.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
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
  }
  const previousTodoQuery = `
        SELECT *
        FROM todo
        WHERE id = ${todoId}; 
    `;
  const previousTodo = await dataBase.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateQuery = `
        UPDATE todo 
        SET 
            todo = '${todo}',
            priority = '${priority}',
            status = '${status}'
        WHERE id = ${todoId};
    `;
  await dataBase.run(updateQuery);
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
        DELETE 
        FROM todo 
        WHERE id = ${todoId};
    `;
  await dataBase.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
