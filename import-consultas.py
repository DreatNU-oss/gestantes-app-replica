import mysql.connector
import csv
import os

DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    print('❌ DATABASE_URL não encontrada')
    exit(1)

parts = DATABASE_URL.replace('mysql://', '').split('@')
user_pass = parts[0].split(':')
host_db = parts[1].split('/')
host_port = host_db[0].split(':')

conn = mysql.connector.connect(
    user=user_pass[0],
    password=user_pass[1],
    host=host_port[0],
    port=int(host_port[1]) if len(host_port) > 1 else 3306,
    database=host_db[1].split('?')[0]
)
cursor = conn.cursor()

print('📊 Lendo CSV de gestantes original...')
map_id_nome = {}
with open('/home/ubuntu/upload/gestantes_20251209_210138.csv', 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    next(reader)
    for row in reader:
        if len(row) > 2:
            id_antigo = int(row[0])
            nome = row[2]
            map_id_nome[id_antigo] = nome

print(f'✅ Mapeamento: {len(map_id_nome)} gestantes')

print('\n🔍 Buscando gestantes no banco...')
cursor.execute('SELECT id, nome FROM gestantes')
map_nome_id = {row[1]: row[0] for row in cursor.fetchall()}
print(f'✅ Encontradas {len(map_nome_id)} gestantes')

print('\n🗑️  Limpando consultas...')
cursor.execute('DELETE FROM consultasPrenatal')
conn.commit()

print('\n📥 Importando consultas...\n')
importadas = 0
sem_gestante = 0

with open('/home/ubuntu/upload/consultasPrenatal_20251210_091102.csv', 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    next(reader)
    
    for row in reader:
        if len(row) < 12:
            continue
            
        id_antigo = int(row[1])
        nome = map_id_nome.get(id_antigo)
        
        if not nome:
            sem_gestante += 1
            continue
            
        novo_id = map_nome_id.get(nome)
        
        if not novo_id:
            sem_gestante += 1
            continue
        
        data_consulta = row[2].split(' ')[0] if row[2] else None
        ig_sem = int(row[3]) if row[3] else None
        ig_dias = int(row[4]) if row[4] else None
        
        peso = None
        if row[5]:
            try:
                peso = int(float(row[5].replace('kg', '').replace(',', '.')) * 1000)
            except:
                pass
        
        pa_sist = row[6] if row[6] else None
        pa_diast = row[7] if row[7] else None
        pressao_arterial = f'{pa_sist}/{pa_diast}' if pa_sist and pa_diast else None
        
        au = None
        if row[8] and row[8] != '12.0':
            try:
                au = int(float(row[8].replace('cm', '').replace(',', '.')))
            except:
                pass
        
        bcf = 1 if row[9] == '1' else 0
        mf = 1 if row[10] == '1' else 0
        obs = row[11] if row[11] else None
        
        cursor.execute('''
            INSERT INTO consultasPrenatal 
            (gestanteId, dataConsulta, igSemanas, igDias, peso, 
             pressaoArterial, alturaUterina, bcf, mf, observacoes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ''', (novo_id, data_consulta, ig_sem, ig_dias, peso,
              pressao_arterial, au, bcf, mf, obs))
        
        importadas += 1
        if importadas % 10 == 0:
            print(f'✅ {importadas} consultas importadas...')

conn.commit()

print(f'\n📊 Resumo:')
print(f'   ✅ Importadas: {importadas}')
print(f'   ⚠️  Sem gestante: {sem_gestante}')

cursor.close()
conn.close()
print('\n✨ Concluído!')
