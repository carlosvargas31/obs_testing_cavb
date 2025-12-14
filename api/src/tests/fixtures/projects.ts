export type ProjectPayload = {
  title: string;
  description?: string;
  version?: string;
  link?: string;
  tag?: string;
  timestamp?: number;
};

export const validProject: ProjectPayload = {
  title: 'Valid Project',
  description: 'A valid project payload',
  version: '1.0.0',
  link: 'https://valid.example.com',
  tag: 'valid',
  timestamp: 1000000000
};

export const invalidProjects: {
  missingTitle: Omit<ProjectPayload, 'title'>;
  missingDescription: ProjectPayload;
  missingVersion: ProjectPayload;
  missingLink: ProjectPayload;
  missingTag: ProjectPayload;
} = {
  missingTitle: {
    description: 'Missing title',
    version: '1.0.0',
    link: 'https://mt.example.com',
    tag: 'invalid'
  },
  missingDescription: {
    title: 'No Description',
    version: '1.0.1',
    link: 'https://nd.example.com',
    tag: 'ok'
  },
  missingVersion: {
    title: 'No Version',
    description: 'desc',
    link: 'https://nv.example.com',
    tag: 'ok'
  },
  missingLink: {
    title: 'No Link',
    description: 'desc',
    version: '1.0.2',
    tag: 'ok'
  },
  missingTag: {
    title: 'No Tag',
    description: 'desc',
    version: '1.0.3',
    link: 'https://nt.example.com'
  }
};

export const sampleProjects: ProjectPayload[] = [
  {
    title: 'Sample 1',
    description: 'First sample',
    version: '0.1.0',
    link: 'https://s1.example.com',
    tag: 'demo',
    timestamp: 100
  },
  {
    title: 'Sample 2',
    description: 'Second sample',
    version: '0.2.0',
    link: 'https://s2.example.com',
    tag: 'demo',
    timestamp: 200
  },
  {
    title: 'Sample 3',
    description: 'Third sample',
    version: '0.3.0',
    link: 'https://s3.example.com',
    tag: 'demo',
    timestamp: 300
  },
  {
    title: 'Sample 4',
    description: 'Fourth sample',
    version: '0.4.0',
    link: 'https://s4.example.com',
    tag: 'demo',
    timestamp: 400
  },
  {
    title: 'Sample 5',
    description: 'Fifth sample',
    version: '0.5.0',
    link: 'https://s5.example.com',
    tag: 'demo',
    timestamp: 500
  }
];