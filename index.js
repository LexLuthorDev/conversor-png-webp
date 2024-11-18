const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const app = express();
const port = 3001;

// Rota para servir os arquivos convertidos
app.use('/downloads', express.static(path.join(__dirname, 'converted')));


// Configuração do multer para upload de múltiplos arquivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage });

// Função para converter PNG para WebP
const convertPngToWebp = (inputPath, outputPath) => {
    return sharp(inputPath)
        .webp({ quality: 80 })
        .toFile(outputPath);
};

// Rota para fazer o upload da pasta com arquivos PNG
app.post('/upload', upload.array('images'), async (req, res) => {
    const files = req.files;
    const outputDir = './converted/';
    const convertedFiles = []; // Para armazenar os nomes dos arquivos convertidos

    // Cria o diretório de saída, se não existir
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Processa os arquivos
    const promises = files.map(file => {
        const inputPath = path.join(file.destination, file.filename);
        const outputPath = path.join(outputDir, file.filename.replace('.png', '.webp'));
        convertedFiles.push(file.filename.replace('.png', '.webp')); // Armazena o nome do arquivo convertido
        return convertPngToWebp(inputPath, outputPath);
    });

    try {
        await Promise.all(promises);
        // Envia a lista de arquivos convertidos como resposta
        res.send(convertedFiles);
    } catch (err) {
        console.error('Erro ao converter as imagens:', err);
        res.status(500).send('Erro ao converter as imagens.');
    }
});


// Servir o frontend
app.use(express.static('public'));

// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
