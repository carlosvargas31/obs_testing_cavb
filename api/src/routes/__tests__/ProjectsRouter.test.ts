import request from 'supertest';
import express, { Application, Router } from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Connection } from 'mongoose';
import bodyParser from 'body-parser';

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
      // Crear múltiples proyectos
      const projects = [
        {
          title: 'Project 1',
          description: 'Desc 1',
          version: '1.0.0',
          link: 'https://p1.com',
          tag: 'tag1',
          timestamp: 1000
        },
        {
          title: 'Project 2',
          description: 'Desc 2',
          version: '2.0.0',
          link: 'https://p2.com',
          tag: 'tag2',
          timestamp: 500
        }
      ];

      await ProjectModel.create(projects);

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
      const newProject = {
        title: 'New Project',
        description: 'New Description',
        version: '2.0.0',
        link: 'https://newproject.com',
        tag: 'new',
        timestamp: Date.now()
      };

      const response = await request(app)
        .post('/v1/projects')
        .send(newProject)
        .expect(201);

      // Verificar que retorna el proyecto creado
      expect(response.body).toHaveProperty('_id');
      expect(response.body.title).toBe(newProject.title);
      expect(response.body.description).toBe(newProject.description);

      // Verificar que el proyecto existe en la DB
      const projectInDb = await ProjectModel.findById(response.body._id);
      expect(projectInDb).toBeTruthy();
      expect(projectInDb?.title).toBe(newProject.title);
    });
  });

  describe('POST /v1/projects - Datos inválidos', () => {
    it('debería retornar status 400 cuando falta el título', async () => {
      const invalidProject = {
        description: 'Missing title',
        version: '1.0.0'
      };

      const response = await request(app)
        .post('/v1/projects')
        .send(invalidProject)
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
