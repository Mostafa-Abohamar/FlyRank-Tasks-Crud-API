import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import apiDoc from "./openapi.js";
import { getTasks, searchTasks, createTask, updateTask, deleteTask, getStats, resetTasks } from "./api/tasksController.js";

const router = Router();

router.use("/api-docs", swaggerUi.serve, swaggerUi.setup(apiDoc));

router.get("/tasks", getTasks);
router.get("/tasks/search", searchTasks);
router.post("/tasks", createTask);
router.put("/tasks/:id", updateTask);
router.delete("/tasks/:id", deleteTask);
router.get("/stats", getStats);
router.post("/reset", resetTasks);

export default router;
