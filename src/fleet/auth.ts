import { 
  type AuthenticationState, 
  type AuthenticationCreds, 
  type SignalDataTypeMap, 
  initAuthCreds, 
  BufferJSON, 
  proto 
} from '@whiskeysockets/baileys';
import { prisma } from '../shared/prisma/client';

export const usePrismaAuthState = async (sessionId: string): Promise<{ state: AuthenticationState, saveCreds: () => Promise<void> }> => {
  const writeData = async (data: any, key: string) => {
    const dataString = JSON.stringify(data, BufferJSON.replacer);
    await prisma.whatsAppSession.upsert({
      where: { sessionId: `${sessionId}:${key}` },
      update: { data: JSON.parse(dataString) },
      create: { 
        sessionId: `${sessionId}:${key}`, 
        vendorId: BigInt(sessionId),
        data: JSON.parse(dataString) 
      }
    });
  };

  const readData = async (key: string) => {
    const session = await prisma.whatsAppSession.findUnique({
      where: { sessionId: `${sessionId}:${key}` }
    });
    if (!session) return null;
    return JSON.parse(JSON.stringify(session.data), BufferJSON.reviver);
  };

  const removeData = async (key: string) => {
    await prisma.whatsAppSession.deleteMany({
      where: { sessionId: `${sessionId}:${key}` }
    });
  };

  const creds: AuthenticationCreds = await readData('creds') || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data: { [id: string]: SignalDataTypeMap[typeof type] } = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(`${type}-${id}`);
              if (type === 'app-state-sync-key' && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value;
            })
          );
          return data;
        },
        set: async (data) => {
          const tasks: Promise<void>[] = [];
          const categoryData = data as Record<string, Record<string, any>>;
          for (const category in categoryData) {
            const sub = categoryData[category];
            if (!sub) continue;
            for (const id in sub) {
              const value = sub[id];
              const key = `${category}-${id}`;
              tasks.push(value ? writeData(value, key) : removeData(key));
            }
          }
          await Promise.all(tasks);
        }
      }
    },
    saveCreds: () => writeData(creds, 'creds')
  };
};
