import express, { Request, Response } from 'express';
import cors from 'cors';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { FileData } from './types/file.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const FILES_PATH = path.join(__dirname, 'files.json');

async function readFiles(): Promise<FileData[]> {
  try {
    const data = await fs.readFile(FILES_PATH, 'utf8');
    return JSON.parse(data).files;
  } catch (error) {
    console.error('Error reading files:', error);
    return [];
  }
}

async function writeFiles(files: FileData[]): Promise<void> {
  try {
    await fs.writeFile(FILES_PATH, JSON.stringify({ files }, null, 2));
  } catch (error) {
    console.error('Error writing files:', error);
    throw error;
  }
}

app.get('/api/files/:userId', async (
  req: Request<{ userId: string }, {}, {}, {}>,
  res: Response<Array<{ id: string; name: string; updatedAt: string }> | { error: string }>
) => {
  try {
    console.log('Getting files for user:', req.params.userId);
    const files = await readFiles();
    const userFiles = files.filter((file: FileData) => file.userId === req.params.userId);
    console.log('Found files:', userFiles);
    res.json(userFiles.map(({ id, name, updatedAt }) => ({ id, name, updatedAt })));
  } catch (error) {
    console.error('Error getting files:', error);
    res.status(500).json({ error: '获取文件列表失败' });
  }
});

app.get('/api/files/detail/:id', async (
  req: Request<{ id: string }, FileData | { error: string }, {}, {}>,
  res: Response<FileData | { error: string }, Record<string, any>>
) => {
  try {
    console.log('Getting file details for:', req.params.id);
    const files = await readFiles();
    const file = files.find((f: FileData) => f.id === req.params.id);
    if (!file) {
      console.log('File not found');
      res.status(404).json({ error: '文件不存在' });
      return;
    }
    console.log('Found file:', file);
    res.json(file);
  } catch (error) {
    console.error('Error getting file details:', error);
    res.status(500).json({ error: '获取文件失败' });
  }
});

app.post('/api/files', async (
  req: Request<{}, {}, { userId: string; params: { name: string; content: string } }>,
  res: Response<FileData | { error: string }>
) => {
  try {
    console.log('Creating new file:', req.body);
    const files = await readFiles();
    const newFile: FileData = {
      id: Math.random().toString(36).substr(2, 9),
      userId: req.body.userId,
      name: req.body.params.name,
      content: req.body.params.content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    files.push(newFile);
    await writeFiles(files);
    console.log('Created file:', newFile);
    res.json(newFile);
  } catch (error) {
    console.error('Error creating file:', error);
    res.status(500).json({ error: '创建文件失败' });
  }
});

app.put<{ id: string }, FileData | { error: string }, Partial<FileData>, {}, Record<string, any>>(
  '/api/files/:id',
  async (
    req: Request<{ id: string }, FileData | { error: string }, Partial<FileData>, {}>,
    res: Response<FileData | { error: string }, Record<string, any>>
  ): Promise<void> => {
  try {
    console.log('Updating file:', req.params.id, req.body);
    const files = await readFiles();
    const index = files.findIndex((f: FileData) => f.id === req.params.id);
    if (index === -1) {
      console.log('File not found');
      res.status(404).json({ error: '文件不存在' });
      return;
    }
    const updatedFile = {
      ...files[index],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    files[index] = updatedFile;
    await writeFiles(files);
    console.log('Updated file:', updatedFile);
    res.json(updatedFile);
  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).json({ error: '更新文件失败' });
  }
});

app.delete<{ id: string }, { success: true } | { error: string }, {}, {}, Record<string, any>>(
  '/api/files/:id',
  async (
    req: Request<{ id: string }, { success: true } | { error: string }, {}, {}>,
    res: Response<{ success: true } | { error: string }, Record<string, any>>
  ): Promise<void> => {
  try {
    console.log('Deleting file:', req.params.id);
    const files = await readFiles();
    const index = files.findIndex((f: FileData) => f.id === req.params.id);
    if (index === -1) {
      console.log('File not found');
      res.status(404).json({ error: '文件不存在' });
      return;
    }
    files.splice(index, 1);
    await writeFiles(files);
    console.log('File deleted');
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: '删除文件失败' });
    return;
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
