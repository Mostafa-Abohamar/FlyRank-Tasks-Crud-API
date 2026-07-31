const apiDoc = {
    openapi: "3.0.0",
    info: { title: "To-Do API", version: "1.0.0" },
    paths: {
        "/tasks": {
            get: {
                summary: "List all tasks",
                parameters: [
                    { name: "done", in: "query", schema: { type: "boolean" }, description: "Filter by completion status" },
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
        "/tasks/search": {
            get: {
                summary: "Search tasks by title",
                parameters: [
                    { name: "q", in: "query", required: true, schema: { type: "string" }, description: "Search term in title" },
                    { name: "done", in: "query", schema: { type: "boolean" }, description: "Filter by completion status" },
                ],
                responses: { 200: { description: "Array of matching tasks" } },
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

export default apiDoc;
