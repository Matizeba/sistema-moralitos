<?php

namespace App\Controllers;

use CodeIgniter\Controller;
use App\Models\ClienteModel;

class Clientes extends Controller
{
    public function __construct()
    {
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method");
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
        if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            exit(0);
        }
    }

    public function index()
    {
        try {
            $model = new ClienteModel();
            return $this->response->setJSON($model->findAll());
        } catch (\Throwable $e) {
            return $this->response->setStatusCode(500)->setBody('EXCEPCIÓN INDEX: ' . $e->getMessage());
        }
    }

    public function buscar($ci = null)
    {
        try {
            $model = new ClienteModel();
            $cliente = $model->where('ci_nit', $ci)->first();
            if ($cliente) {
                return $this->response->setJSON(['status' => 200, 'data' => $cliente]);
            }
            return $this->response->setStatusCode(404)->setJSON(['status' => 404, 'message' => 'Cliente no encontrado']);
        } catch (\Throwable $e) {
            return $this->response->setStatusCode(500)->setBody('EXCEPCIÓN BUSCAR: ' . $e->getMessage());
        }
    }

    public function create()
    {
        try {
            $model = new ClienteModel();
            $raw = $this->request->getJSON(true);

            if (!is_array($raw)) {
                $raw = $this->request->getPost();
            }
            if (!is_array($raw)) {
                $raw = [];
            }

            $data = [
                'ci_nit'          => trim($raw['ci_nit'] ?? ''),
                'nombre_completo' => trim($raw['nombre_completo'] ?? ''),
                'celular'         => trim($raw['celular'] ?? '')
            ];

            if (empty($data['ci_nit'])) {
                return $this->response->setStatusCode(400)->setBody('El CI/NIT es obligatorio');
            }

            // 1. Si el cliente ya existe por CI/NIT en MariaDB, lo devolvemos sin duplicar
            $existente = $model->where('ci_nit', $data['ci_nit'])->first();
            if ($existente) {
                return $this->response->setJSON(['status' => 200, 'data' => $existente]);
            }

            // 2. Si no existe, lo insertamos
            $newId = $model->insert($data);
            if ($newId) {
                $data['id'] = $newId;
                return $this->response->setStatusCode(201)->setJSON(['status' => 201, 'data' => $data]);
            }

            return $this->response->setStatusCode(400)->setJSON(['errors' => $model->errors()]);

        } catch (\Throwable $e) {
            return $this->response->setStatusCode(500)->setBody('EXCEPCIÓN CLIENTE: ' . $e->getMessage() . ' en línea ' . $e->getLine());
        }
    }
}
