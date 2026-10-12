<?php

namespace App\Controllers;

use CodeIgniter\Controller;
use App\Models\EncomiendaModel;

class Encomiendas extends Controller
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
            $model = new EncomiendaModel();
            $encomiendas = $model->obtenerTodas();
            foreach ($encomiendas as &$enc) {
                if (!isset($enc['tipo_pago'])) {
                    $enc['tipo_pago'] = 'PAGADO';
                }
            }
            return $this->response->setJSON($encomiendas);
        } catch (\Throwable $e) {
            return $this->response->setStatusCode(500)->setBody('Error index: ' . $e->getMessage());
        }
    }

    public function create()
    {
        try {
            $model = new EncomiendaModel();
            $raw = $this->request->getJSON(true) ?? $this->request->getPost() ?? [];

            $codigoRastreo = 'TM-' . rand(1000, 9999);

            $payload = [
                'codigo_rastreo'  => $codigoRastreo,
                'remitente_id'    => intval($raw['remitente_id'] ?? 0),
                'destinatario_id'  => intval($raw['destinatario_id'] ?? 0),
                'origen_id'        => intval($raw['origen_id'] ?? 1),
                'destino_id'       => intval($raw['destino_id'] ?? 2),
                'descripcion'      => trim($raw['descripcion'] ?? ''),
                'precio'           => floatval($raw['precio'] ?? 0),
                'estado'           => 'Recibido',
                'fecha_registro'   => date('Y-m-d H:i:s')
            ];

            $newId = $model->insert($payload, false);

            if ($newId) {
                $payload['id'] = $newId;
                $payload['tipo_pago'] = $raw['tipo_pago'] ?? 'PAGADO';
                return $this->response->setStatusCode(201)->setJSON([
                    'status' => 201, 
                    'data' => $payload
                ]);
            }

            return $this->response->setStatusCode(400)->setJSON([
                'status' => 400,
                'errors' => $model->errors()
            ]);

        } catch (\Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON([
                'status' => 500,
                'error' => $e->getMessage()
            ]);
        }
    }

    public function actualizarEstado($id = null)
    {
        try {
            $model = new EncomiendaModel();
            $raw = $this->request->getJSON(true) ?? [];
            $nuevoEstado = $raw['estado'] ?? 'En Tránsito';

            $model->update($id, ['estado' => $nuevoEstado]);
            return $this->response->setJSON(['status' => 200, 'message' => 'Estado actualizado']);
        } catch (\Throwable $e) {
            return $this->response->setStatusCode(500)->setBody('Error al actualizar estado: ' . $e->getMessage());
        }
    }

    public function rastrear($guia = null)
    {
        try {
            $model = new EncomiendaModel();
            $guiaLimpia = strtoupper(trim($guia ?? ''));

            if (empty($guiaLimpia)) {
                return $this->response->setStatusCode(400)->setJSON([
                    'status' => 400, 
                    'message' => 'Número de guía vacío'
                ]);
            }

            // Extraemos solo los números por si el usuario escribe TM-5040 o solo 5040
            $soloNumeros = preg_replace('/[^0-9]/', '', $guiaLimpia);

            $builder = $model->select('encomiendas.*, 
                                      r.nombre_completo as remitente_nombre, 
                                      d.nombre_completo as destinatario_nombre')
                             ->join('clientes r', 'r.id = encomiendas.remitente_id', 'left')
                             ->join('clientes d', 'd.id = encomiendas.destinatario_id', 'left');

            // Búsqueda robusta por código_rastreo directo (TM-5040), por ID directo, o por código con formato
            $builder->groupStart()
                    ->where('encomiendas.codigo_rastreo', $guiaLimpia);

            if (!empty($soloNumeros)) {
                $builder->orWhere('encomiendas.id', $soloNumeros)
                        ->orWhere('encomiendas.codigo_rastreo', 'TM-' . $soloNumeros);
            }

            $builder->groupEnd();

            $encomienda = $builder->first();

            if ($encomienda) {
                if (!isset($encomienda['tipo_pago']) || empty($encomienda['tipo_pago'])) {
                    $encomienda['tipo_pago'] = 'PAGADO';
                }
                return $this->response->setJSON([
                    'status' => 200, 
                    'data' => $encomienda
                ]);
            }

            return $this->response->setStatusCode(404)->setJSON([
                'status' => 404, 
                'message' => 'No se encontró ninguna encomienda registrada con esa guía.'
            ]);

        } catch (\Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON([
                'status' => 500, 
                'error' => $e->getMessage()
            ]);
        }
    }
}