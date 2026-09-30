import * as taskRepo from "../data/taskRepository.js";

const toBool = (value) => value === true || value === 1 || value === "true" || value === "1";

const parseId = (raw) => {
    const id = Number(raw);
    return Number.isInteger(id) && id > 0 ? id : null;
};

const doneFilter = (done) => {
    if (done === undefined || done === "") return null;
    if (done === "true" || done === "1") return 1;
    if (done === "false" || done === "0") return 0;
    return undefined;
};

export const getTasks = async (req, res) => {
    const done = doneFilter(req.query.done);
    if (done === undefined) return res.status(400).json({ error: "done must be true or false" });
    res.json(await taskRepo.listTasks(done));
};

export const searchTasks = async (req, res) => {
    const q = (req.query.q || "").trim();
    if (!q) return res.status(400).json({ error: "q is required" });
    const done = doneFilter(req.query.done);
    if (done === undefined) return res.status(400).json({ error: "done must be true or false" });
    res.json(await taskRepo.searchTasks(q, done));
};

export const createTask = async (req, res) => {
    const title = typeof req.body.title === "string" ? req.body.title.trim() : req.body.title;
    if (!title) return res.status(400).json({ error: "title is required" });
    const task = await taskRepo.createTask({ title, completed: toBool(req.body.completed) });
    res.status(201).json(task);
};

export const updateTask = async (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json({ error: "id must be a positive integer" });
    const { title, completed } = req.body;
    if (title !== undefined && (typeof title !== "string" || !title.trim())) {
        return res.status(400).json({ error: "title cannot be empty" });
    }
    const task = await taskRepo.updateTask(id, {
        title: title !== undefined ? title.trim() : undefined,
        completed: completed !== undefined ? toBool(completed) : undefined,
    });
    if (!task) return res.status(404).json({ error: "task not found" });
    res.json(task);
};

export const deleteTask = async (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json({ error: "id must be a positive integer" });
    if (!(await taskRepo.deleteTask(id))) return res.status(404).json({ error: "task not found" });
    res.status(204).send();
};

export const getStats = async (req, res) => {
    res.json(await taskRepo.getStats());
};

export const resetTasks = async (req, res) => {
    res.json(await taskRepo.resetTasks());
};
