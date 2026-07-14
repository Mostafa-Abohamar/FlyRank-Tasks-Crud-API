let tasks = [];
let nextId = 1;

export const getTasks = (req, res) => {
    let result = tasks;
    if (req.query.done !== undefined) {
        let done = req.query.done === "true";
        result = result.filter(t => t.completed === done);
    }
    if (req.query.search) {
        let q = req.query.search.toLowerCase();
        result = result.filter(t => t.title.toLowerCase().includes(q));
    }
    res.json(result);
};

export const createTask = (req, res) => {
    let { title, completed } = req.body;
    if (!title) return res.status(400).json({ error: "title is required" });
    let task = { id: nextId++, title, completed: !!completed };
    tasks.push(task);
    res.status(201).json(task);
};

export const updateTask = (req, res) => {
    let id = Number(req.params.id);
    let task = tasks.find((t) => t.id === id);
    if (!task) return res.status(404).json({ error: "task not found" });
    let { title, completed } = req.body;
    if (title !== undefined) task.title = title;
    if (completed !== undefined) task.completed = completed;
    res.json(task);
};

export const deleteTask = (req, res) => {
    let id = Number(req.params.id);
    let index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return res.status(404).json({ error: "task not found" });
    tasks.splice(index, 1);
    res.status(204).send();
};

export const getStats = (req, res) => {
    let total = tasks.length;
    let done = tasks.filter(t => t.completed).length;
    res.json({ total, done, open: total - done });
};

export const resetTasks = (req, res) => {
    tasks = [
        { id: 1, title: "buy groceries", completed: false },
        { id: 2, title: "learn express", completed: true },
        { id: 3, title: "write tests", completed: false }
    ];
    nextId = 4;
    res.json(tasks);
};
