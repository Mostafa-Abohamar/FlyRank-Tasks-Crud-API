import express from "express";
import swaggerUi from "swagger-ui-express";
import { getTasks, createTask, updateTask, deleteTask, getStats, resetTasks } from "./controllers.js";

let app = express();
app.use(express.json());

let apiDoc = {
    openapi: "3.0.0",
    info: { title: "To-Do API", version: "1.0.0" },
    paths: {
        "/tasks": {
            get: {
                summary: "List all tasks",
                parameters: [
                    { name: "done", in: "query", schema: { type: "boolean" }, description: "Filter by completion status" },
                    { name: "search", in: "query", schema: { type: "string" }, description: "Search in title" },
                ],
                responses: { 200: { description: "Array of tasks" } },
            },
            post: {
                summary: "Create a task",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    title: { type: "string" },
                                    completed: { type: "boolean" },
                                },
                                required: ["title"],
                            },
                        },
                    },
                },
                responses: { 201: { description: "Created task" } },
            },
        },
        "/tasks/{id}": {
            put: {
                summary: "Update a task",
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "integer" },
                    },
                ],
                requestBody: {
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    title: { type: "string" },
                                    completed: { type: "boolean" },
                                },
                            },
                        },
                    },
                },
                responses: { 200: { description: "Updated task" } },
            },
            delete: {
                summary: "Delete a task",
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "integer" },
                    },
                ],
                responses: { 204: { description: "No content" } },
            },
        },
        "/stats": {
            get: {
                summary: "Get task statistics",
                responses: { 200: { description: "Task counts", content: { "application/json": { schema: { type: "object", properties: { total: { type: "integer" }, done: { type: "integer" }, open: { type: "integer" } } } } } } },
            },
        },
        "/reset": {
            post: {
                summary: "Reset to seed tasks",
                responses: { 200: { description: "Array of seed tasks" } },
            },
        },
    },
};

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(apiDoc));

app.get("/tasks", getTasks);
app.post("/tasks", createTask);
app.put("/tasks/:id", updateTask);
app.delete("/tasks/:id", deleteTask);
app.get("/stats", getStats);
app.post("/reset", resetTasks);

app.listen(3000, () => console.log("listening on http://localhost:3000"));
