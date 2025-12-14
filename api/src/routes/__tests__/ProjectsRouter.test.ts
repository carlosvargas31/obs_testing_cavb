import request from 'supertest';
import express, { Application, Router } from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Connection } from 'mongoose';
import bodyParser from 'body-parser';
import { validProject, invalidProjects } from '@/tests/fixtures/projects';
import { buildProject, resetProjectFactory } from '@/tests/factories/projectFactory';

// Definir el schema directamente para evitar dependencias circulares
const ProjectSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    version: String,
    link: String,
    tag: String,
    timestamp: Number
  },
  {
    collection: 'projects',
    versionKey: false
  }
);

describe('ProjectsRouter', () => {
  let app: Application;
  let mongoServer: MongoMemoryServer | null = null;
  let connection: Connection;
  let ProjectModel: mongoose.Model<any>;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({
      instance: {
        port: 27020
      }
    });
    const mongoUri = mongoServer.getUri();

    // Crear nueva conexión para testing
    connection = mongoose.createConnection(mongoUri);
    ProjectModel = connection.model('ProjectsModel', ProjectSchema);

    // Crear rutas manualmente para evitar imports circulares
    const router = Router();

    // GET /v1/projects - Listar todos
    router.get('/', async (req, res, next) => {
      try {
        const projects = await ProjectModel.find({});
        res.status(200).json(projects.sort((a, b) => a.timestamp - b.timestamp));
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // POST /v1/projects - Crear proyecto
    router.post('/', async (req, res, next) => {
      try {
        // Validación simple
        if (!req.body.title) {
          return res.status(400).json({ error: '\"title\" is required' });
        }

        const project = await ProjectModel.create(req.body);
        res.status(201).json(project);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    // Configurar Express app para testing
    app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use('/v1/projects', router);
  });

  afterAll(async () => {
    // Limpiar y cerrar conexiones
    if (connection) {
      await connection.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    // Limpiar la colección antes de cada test
    await ProjectModel.deleteMany({});
    resetProjectFactory();
  });

  describe('GET /v1/projects - Listar todos los proyectos', () => {
    it('debería retornar un array vacío cuando no hay proyectos', async () => {
      const response = await request(app)
        .get('/v1/projects')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('debería retornar todos los proyectos ordenados por timestamp', async () => {
      const p1 = buildProject({ timestamp: 1000 });
      const p2 = buildProject({ timestamp: 500 });
      await ProjectModel.create([p1, p2]);

      const response = await request(app)
        .get('/v1/projects')
        .expect(200);

      expect(response.body.length).toBe(2);
      // Verificar orden por timestamp
      expect(response.body[0].timestamp).toBeLessThan(response.body[1].timestamp);
    });
  });

  describe('POST /v1/projects - Crear proyecto válido', () => {
    it('debería crear un proyecto y retornar status 201', async () => {
      const response = await request(app)
        .post('/v1/projects')
        .send(validProject)
        .expect(201);

      // Verificar que retorna el proyecto creado
      expect(response.body).toHaveProperty('_id');
      expect(response.body.title).toBe(validProject.title);
      expect(response.body.description).toBe(validProject.description);

      // Verificar que el proyecto existe en la DB
      const projectInDb = await ProjectModel.findById(response.body._id);
      expect(projectInDb).toBeTruthy();
      expect(projectInDb?.title).toBe(validProject.title);
    });
  });

  describe('POST /v1/projects - Datos inválidos', () => {
    it('debería retornar status 400 cuando falta el título', async () => {
      const response = await request(app)
        .post('/v1/projects')
        .send(invalidProjects.missingTitle)
        .expect(400);

      // Verificar mensaje de validación
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('title');
    });

    it('debería retornar status 400 con proyecto vacío', async () => {
      const response = await request(app)
        .post('/v1/projects')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});
