const fs = require('fs')
const path = require('path')

const classFile = path.join(__dirname, '..', 'lib', 'generated', 'prisma', 'internal', 'class.ts')
let content = fs.readFileSync(classFile, 'utf8')

if (content.includes('"orders"') && content.includes('runtimeDataModel') && content.includes('orders')) {
  console.log('orders already patched in runtimeDataModel, checking inlineSchema...')
}

// 1. Patch inlineSchema — inject orders model before refresh_tokens
if (!content.includes('model orders')) {
  const ordersSchemaBlock = [
    '',
    '',
    'model orders {',
    '  id              Int      @id @default(autoincrement())',
    '  order_code      String   @unique @db.VarChar(64)',
    '  user_id         Int?',
    '  player_id       String   @db.VarChar(100)',
    '  server_id       String?  @db.VarChar(100)',
    '  nickname        String   @db.VarChar(100)',
    '  game_slug       String   @db.VarChar(255)',
    '  game_name       String   @db.VarChar(255)',
    '  game_image      String?  @db.VarChar(500)',
    '  item_label      String   @db.VarChar(255)',
    '  item_price      Int',
    '  payment_method  String?  @db.VarChar(100)',
    '  xendit_invoice_id String? @db.VarChar(255)',
    '  xendit_invoice_url String? @db.VarChar(500)',
    '  status          String   @default(\\"pending\\") @db.VarChar(50)',
    '  processed_at    DateTime?',
    '  created_at      DateTime @default(now()) @db.DateTime(0)',
    '  updated_at      DateTime @default(now()) @updatedAt @db.DateTime(0)',
    '}',
  ].join('\\n')

  content = content.replace(
    '\\nmodel refresh_tokens {',
    ordersSchemaBlock + '\\n\\nmodel refresh_tokens {'
  )
  console.log('Patched inlineSchema')
} else {
  console.log('inlineSchema already has orders')
}

// 2. Patch runtimeDataModel JSON string — add orders fields
const ordersRuntimeModel = '"orders":{"fields":[{"name":"id","kind":"scalar","type":"Int"},{"name":"order_code","kind":"scalar","type":"String"},{"name":"user_id","kind":"scalar","type":"Int"},{"name":"player_id","kind":"scalar","type":"String"},{"name":"server_id","kind":"scalar","type":"String"},{"name":"nickname","kind":"scalar","type":"String"},{"name":"game_slug","kind":"scalar","type":"String"},{"name":"game_name","kind":"scalar","type":"String"},{"name":"game_image","kind":"scalar","type":"String"},{"name":"item_label","kind":"scalar","type":"String"},{"name":"item_price","kind":"scalar","type":"Int"},{"name":"payment_method","kind":"scalar","type":"String"},{"name":"xendit_invoice_id","kind":"scalar","type":"String"},{"name":"xendit_invoice_url","kind":"scalar","type":"String"},{"name":"status","kind":"scalar","type":"String"},{"name":"processed_at","kind":"scalar","type":"DateTime"},{"name":"created_at","kind":"scalar","type":"DateTime"},{"name":"updated_at","kind":"scalar","type":"DateTime"}],"dbName":null}'

if (!content.includes('"orders":{')) {
  content = content.replace(
    '"refresh_tokens":{"fields"',
    ordersRuntimeModel + ',"refresh_tokens":{"fields"'
  )
  console.log('Patched runtimeDataModel')
} else {
  console.log('runtimeDataModel already has orders')
}

fs.writeFileSync(classFile, content)
console.log('Done! class.ts patched successfully.')
