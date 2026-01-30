"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
app.post("/save-level-time", async (req, res) => {
    const { student_name, class_name, level_name, time_elapsed, checkpoint_time, reached_checkpoint } = req.body;
    try {
        const className = class_name || "Sexto Basica A";
        let classRecord = await prisma.class.findFirst({
            where: { class_name: className }
        });
        if (!classRecord) {
            return res.status(404).json({
                error: `Clase "${className}" no encontrada. Por favor, crea la clase primero.`
            });
        }
        let student = await prisma.student.findFirst({
            where: {
                class_id: classRecord.id,
                student_name: student_name
            }
        });
        if (!student) {
            student = await prisma.student.create({
                data: {
                    class_id: classRecord.id,
                    student_name: student_name
                }
            });
        }
        const attempt = await prisma.levelAttempt.create({
            data: {
                student_id: student.id,
                level_name: level_name || "level-1",
                time_elapsed: time_elapsed,
                checkpoint_time: checkpoint_time,
                reached_checkpoint: reached_checkpoint
            }
        });
        res.json({
            success: true,
            attempt,
            student: {
                id: student.id,
                name: student.student_name
            }
        });
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(error.message);
            res.status(500).json({ error: error.message });
        }
        else {
            console.error(error);
            res.status(500).json({ error: "Error desconocido" });
        }
    }
});
app.get("/", async (_req, res) => {
    const recentAttempts = await prisma.levelAttempt.findMany({
        orderBy: { created_at: "desc" },
        take: 10,
        include: {
            student: {
                include: {
                    class: true
                }
            }
        }
    });
    res.json({
        status: "ok",
        message: "Aventura Numeral backend esta en vivo 🚀",
        recentAttempts
    });
});
// Auto-crear o obtener maestro por email
app.post("/teachers/auto-create", async (req, res) => {
    try {
        const { email, name } = req.body;
        if (!email || !name) {
            return res.status(400).json({ error: "Email y nombre son requeridos" });
        }
        let teacher = await prisma.teacher.findUnique({
            where: { email },
            include: {
                classes: {
                    include: {
                        _count: {
                            select: { students: true }
                        }
                    }
                }
            }
        });
        if (!teacher) {
            teacher = await prisma.teacher.create({
                data: { email, name },
                include: {
                    classes: {
                        include: {
                            _count: {
                                select: { students: true }
                            }
                        }
                    }
                }
            });
        }
        res.json({ teacher, created: !teacher });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: "Error desconocido" });
        }
    }
});
app.get("/teacher/by-email/:email", async (req, res) => {
    try {
        const email = req.params.email;
        const teacher = await prisma.teacher.findUnique({
            where: { email },
            include: {
                classes: {
                    include: {
                        _count: {
                            select: { students: true }
                        }
                    }
                }
            }
        });
        if (!teacher) {
            return res.status(404).json({ error: "Profesor no encontrado" });
        }
        res.json({ teacher });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: "Error desconocido" });
        }
    }
});
app.get("/teachers/:teacherId/classes", async (req, res) => {
    try {
        const teacherId = parseInt(req.params.teacherId);
        const classes = await prisma.class.findMany({
            where: { teacher_id: teacherId },
            include: {
                _count: {
                    select: { students: true }
                }
            }
        });
        res.json({ classes });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: "Error desconocido" });
        }
    }
});
// Crear nueva clase
app.post("/classes", async (req, res) => {
    try {
        const { teacher_id, class_name, access_code } = req.body;
        if (!teacher_id || !class_name) {
            return res.status(400).json({ error: "teacher_id y class_name son requeridos" });
        }
        const newClass = await prisma.class.create({
            data: {
                teacher_id: parseInt(teacher_id),
                class_name,
                access_code: access_code || null
            },
            include: {
                _count: {
                    select: { students: true }
                }
            }
        });
        res.json({ success: true, class: newClass });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: "Error desconocido" });
        }
    }
});
// Crear estudiante
app.post("/classes/:classId/students", async (req, res) => {
    try {
        const classId = parseInt(req.params.classId);
        const { student_name, avatar } = req.body;
        if (!student_name) {
            return res.status(400).json({ error: "student_name es requerido" });
        }
        const newStudent = await prisma.student.create({
            data: {
                class_id: classId,
                student_name,
                avatar: avatar || "avatargirl1"
            }
        });
        res.json({ success: true, student: newStudent });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: "Error desconocido" });
        }
    }
});
app.get("/classes/:classId/students", async (req, res) => {
    try {
        const classId = parseInt(req.params.classId);
        const students = await prisma.student.findMany({
            where: { class_id: classId },
            include: {
                _count: {
                    select: { attempts: true }
                }
            },
            orderBy: { student_name: "asc" }
        });
        res.json({ students });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: "Error desconocido" });
        }
    }
});
app.get("/students/:studentId/attempts", async (req, res) => {
    try {
        const studentId = parseInt(req.params.studentId);
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: { class: true }
        });
        const attempts = await prisma.levelAttempt.findMany({
            where: { student_id: studentId },
            orderBy: { created_at: "desc" }
        });
        res.json({ student, attempts });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: "Error desconocido" });
        }
    }
});
app.patch("/students/:studentId/label", async (req, res) => {
    try {
        const studentId = parseInt(req.params.studentId);
        const { label } = req.body;
        const student = await prisma.student.update({
            where: { id: studentId },
            data: { label }
        });
        res.json({ success: true, student });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: "Error desconocido" });
        }
    }
});
// Actualizar avatar del estudiante
app.patch("/students/:studentId/avatar", async (req, res) => {
    try {
        const studentId = parseInt(req.params.studentId);
        const { avatar } = req.body;
        const student = await prisma.student.update({
            where: { id: studentId },
            data: { avatar }
        });
        res.json({ success: true, student });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: "Error desconocido" });
        }
    }
});
// Actualizar recursos (monedas, vidas, estrellas)
app.patch("/students/:studentId/resources", async (req, res) => {
    try {
        const studentId = parseInt(req.params.studentId);
        const { coins, lives, stars } = req.body;
        const updateData = {};
        if (coins !== undefined)
            updateData.coins = coins;
        if (lives !== undefined)
            updateData.lives = lives;
        if (stars !== undefined)
            updateData.stars = stars;
        const student = await prisma.student.update({
            where: { id: studentId },
            data: updateData
        });
        res.json({ success: true, student });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: "Error desconocido" });
        }
    }
});
// Obtener estudiante por ID con todos sus datos
app.get("/students/:studentId", async (req, res) => {
    try {
        const studentId = parseInt(req.params.studentId);
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: {
                class: true,
                items: {
                    include: {
                        item: true
                    }
                }
            }
        });
        if (!student) {
            return res.status(404).json({ error: "Estudiante no encontrado" });
        }
        res.json({ student });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: "Error desconocido" });
        }
    }
});
// Comprar item
app.post("/students/:studentId/buy-item", async (req, res) => {
    try {
        const studentId = parseInt(req.params.studentId);
        const { itemId } = req.body;
        const student = await prisma.student.findUnique({
            where: { id: studentId }
        });
        const item = await prisma.item.findUnique({
            where: { id: itemId }
        });
        if (!student || !item) {
            return res.status(404).json({ error: "Estudiante o item no encontrado" });
        }
        if (student.coins < item.cost) {
            return res.status(400).json({ error: "Monedas insuficientes" });
        }
        // Verificar si ya tiene el item
        const existingItem = await prisma.studentItem.findFirst({
            where: {
                student_id: studentId,
                item_id: itemId
            }
        });
        if (existingItem) {
            return res.status(400).json({ error: "Ya tienes este item" });
        }
        // Comprar item
        await prisma.studentItem.create({
            data: {
                student_id: studentId,
                item_id: itemId
            }
        });
        // Restar monedas
        const updatedStudent = await prisma.student.update({
            where: { id: studentId },
            data: { coins: student.coins - item.cost }
        });
        res.json({ success: true, student: updatedStudent });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: "Error desconocido" });
        }
    }
});
// Usar item
app.post("/students/:studentId/use-item", async (req, res) => {
    try {
        const studentId = parseInt(req.params.studentId);
        const { itemId } = req.body;
        const inventory = await prisma.studentItem.findFirst({
            where: {
                student_id: studentId,
                item_id: itemId
            }
        });
        if (!inventory) {
            return res.status(400).json({ error: "No tienes este item" });
        }
        // Eliminar item usado
        await prisma.studentItem.delete({
            where: { id: inventory.id }
        });
        res.json({ success: true });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: "Error desconocido" });
        }
    }
});
// Listar todos los items disponibles
app.get("/items", async (_req, res) => {
    try {
        const items = await prisma.item.findMany({
            orderBy: { cost: "asc" }
        });
        res.json({ items });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: "Error desconocido" });
        }
    }
});
app.get("/classes", async (_req, res) => {
    try {
        const classes = await prisma.class.findMany({
            select: {
                id: true,
                class_name: true
            },
            orderBy: { class_name: "asc" }
        });
        res.json({ classes });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: "Error desconocido" });
        }
    }
});
app.get("/classes/:classId/student-names", async (req, res) => {
    try {
        const classId = parseInt(req.params.classId);
        const students = await prisma.student.findMany({
            where: { class_id: classId },
            select: {
                id: true,
                student_name: true,
                avatar: true
            },
            orderBy: { student_name: "asc" }
        });
        res.json({ students });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: "Error desconocido" });
        }
    }
});
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
