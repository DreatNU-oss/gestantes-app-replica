#!/bin/bash

# Gerar código de 6 dígitos
CODIGO=$(shuf -i 100000-999999 -n 1)

# Data de expiração (15 minutos a partir de agora)
EXPIRES_AT=$(date -u -d '+15 minutes' '+%Y-%m-%d %H:%M:%S')

# Buscar gestante por email
GESTANTE_ID=$(mysql -h gateway01.us-west-2.prod.aws.tidbcloud.com -P 4000 -u 4tUmH4h2HGXNqxT.root -p'HZxoXWgVzjjBrEhp' -D gestantes_app --ssl-mode=REQUIRED -N -e "SELECT id FROM gestantes WHERE email = 'dreatnu@yahoo.com' LIMIT 1;" 2>/dev/null)

if [ -z "$GESTANTE_ID" ]; then
  echo "ERRO: Nenhuma gestante encontrada com o email dreatnu@yahoo.com"
  exit 1
fi

# Inserir código
mysql -h gateway01.us-west-2.prod.aws.tidbcloud.com -P 4000 -u 4tUmH4h2HGXNqxT.root -p'HZxoXWgVzjjBrEhp' -D gestantes_app --ssl-mode=REQUIRED -e "INSERT INTO codigosAcessoGestante (gestanteId, codigo, expiresAt, usado) VALUES ($GESTANTE_ID, '$CODIGO', '$EXPIRES_AT', 0);" 2>/dev/null

echo "✅ Código gerado com sucesso!"
echo "Email: dreatnu@yahoo.com"
echo "Código: $CODIGO"
echo "Válido até: $(date -d '+15 minutes' '+%Y-%m-%d %H:%M:%S')"
