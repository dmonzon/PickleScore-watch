export interface SavedMatchRecord {
  id: string;
  playedAt: string;
  durationMinutes: number;
  format: 'doubles' | 'singles';
  scoringRule: 'traditional' | 'rally';
  teamAName: string;
  teamBName: string;
  scoreA: number;
  scoreB: number;
  setScores: Array<{ a: number; b: number }>;
  winner: 'A' | 'B';
  totalRallies: number;
  blePacketsSynced: number;
}

export const INITIAL_MATCH_HISTORY: SavedMatchRecord[] = [
  {
    id: 'm-20261116-01',
    playedAt: 'Hoy · 17:40',
    durationMinutes: 24,
    format: 'doubles',
    scoringRule: 'traditional',
    teamAName: 'Diego / Carlos',
    teamBName: 'Mateo / Lucía',
    scoreA: 11,
    scoreB: 8,
    setScores: [{ a: 11, b: 8 }],
    winner: 'A',
    totalRallies: 38,
    blePacketsSynced: 40,
  },
  {
    id: 'm-20261115-02',
    playedAt: 'Ayer · 19:15',
    durationMinutes: 41,
    format: 'doubles',
    scoringRule: 'traditional',
    teamAName: 'Diego / Carlos',
    teamBName: 'Sofía / Andrés',
    scoreA: 9,
    scoreB: 11,
    setScores: [
      { a: 11, b: 7 },
      { a: 8, b: 11 },
      { a: 9, b: 11 },
    ],
    winner: 'B',
    totalRallies: 94,
    blePacketsSynced: 97,
  },
  {
    id: 'm-20261114-03',
    playedAt: '14 Nov · 08:30',
    durationMinutes: 19,
    format: 'singles',
    scoringRule: 'rally',
    teamAName: 'Diego',
    teamBName: 'Javier',
    scoreA: 15,
    scoreB: 12,
    setScores: [{ a: 15, b: 12 }],
    winner: 'A',
    totalRallies: 27,
    blePacketsSynced: 29,
  },
];

export interface ArchitectureLayer {
  id: string;
  module: string;
  platform: string;
  responsibilities: string[];
  keyApis: string;
}

export const ARCHITECTURE_LAYERS: ArchitectureLayer[] = [
  {
    id: 'shared',
    module: ':shared-protocol (Kotlin Multiplatform / Pure JVM)',
    platform: 'Compartido Watch + Móvil',
    responsibilities: [
      'Máquina de estados inmutable de Pickleball (Dobles 0-0-2, Singles, Side-Out y Rally)',
      'Empaquetado binario de 12 bytes + verificación CRC-8 (sin JSON sobre el enlace BLE)',
      'Resolución determinista de conflictos mediante número de secuencia monotónico (seq)',
    ],
    keyApis: 'kotlinx.coroutines.flow.StateFlow · ByteBuffer · CRC-8',
  },
  {
    id: 'wear',
    module: ':wear-app (Wear OS 5 · Galaxy Watch Ultra)',
    platform: 'Reloj (GATT Server + Outbox Local)',
    responsibilities: [
      'UI Jetpack Compose for Wear OS optimizada para pantalla AMOLED 480×480px y sol directo',
      'Captura del Botón Rápido Naranja (KeyEvent) y vibración háptica diferenciada por evento',
      'Cola persistente Room Outbox: guarda puntos si el móvil queda fuera de alcance (>10m)',
      'Modo Always-On Display (AmbientLifecycleObserver) para ahorrar batería entre puntos',
    ],
    keyApis: 'BluetoothGattServer · Room DB · AmbientLifecycleObserver · VibrationEffect',
  },
  {
    id: 'mobile',
    module: ':mobile-app (Android Companion · Bluetooth GATT Client)',
    platform: 'Smartphone Emparejado',
    responsibilities: [
      'Escaneo y reconexión automática en segundo plano (autoConnect = true)',
      'Suscripción a notificaciones GATT (CCCD 0x2902) y envío de ACK por secuencia',
      'Cancha en vivo, línea de tiempo rally a rally e historial histórico en Room / CSV',
    ],
    keyApis: 'BluetoothGatt · CompanionDeviceManager · WorkManager · Jetpack Compose',
  },
];

export interface PacketByteSpec {
  offset: string;
  field: string;
  size: string;
  description: string;
}

export const PACKET_SPEC: PacketByteSpec[] = [
  { offset: 'Byte 0', field: 'MAGIC_HEADER', size: '1 B', description: 'Constante 0x50 ("P") para validar inicio de trama.' },
  { offset: 'Byte 1', field: 'PROTO_FLAGS', size: '1 B', description: 'Bits 7..4 versión (0x1); Bit 0 = Dobles; Bit 1 = Rally Scoring.' },
  { offset: 'Bytes 2–3', field: 'SEQ_NUM', size: '2 B (uint16)', description: 'Secuencia monotónica (1..65535) para idempotencia y reintentos.' },
  { offset: 'Bytes 4–5', field: 'MATCH_HASH', size: '2 B (uint16)', description: 'Hash FNV-1a de 16 bits del UUID de partido.' },
  { offset: 'Byte 6', field: 'SCORE_A', size: '1 B (uint8)', description: 'Puntos actuales del Equipo A (Nosotros).' },
  { offset: 'Byte 7', field: 'SCORE_B', size: '1 B (uint8)', description: 'Puntos actuales del Equipo B (Rivales).' },
  { offset: 'Byte 8', field: 'SERVE_FLAGS', size: '1 B', description: 'Bit 0 equipo que saca · Bit 1 servidor 1/2 · Bit 2 lado Der/Izq · Bit 3 fin · Bits 4–5 ganador.' },
  { offset: 'Byte 9', field: 'SETS_PACKED', size: '1 B', description: 'Nibble alto = sets ganados A; Nibble bajo = sets ganados B.' },
  { offset: 'Byte 10', field: 'EVENT_TYPE', size: '1 B', description: '0=INIT, 1=POINT_A, 2=POINT_B, 3=NEXT_SERVER, 4=SIDE_OUT, 5=UNDO, 6=SET, 7=WIN.' },
  { offset: 'Byte 11', field: 'CRC8_CHECKSUM', size: '1 B', description: 'Polinomio CRC-8 (0x07) sobre Bytes 0..10 para integridad de enlace.' },
];

export interface GattCharacteristicSpec {
  name: string;
  uuid: string;
  properties: string;
  purpose: string;
}

export const GATT_SPEC: GattCharacteristicSpec[] = [
  {
    name: 'Servicio Principal Pickleball',
    uuid: '0000FE50-0000-1000-8000-00805F9B34FB',
    properties: 'Primary Service',
    purpose: 'Anunciado en BLE Advertising para descubrimiento rápido desde el smartphone.',
  },
  {
    name: 'CHAR_SCORE_STATE',
    uuid: '0000FE51-0000-1000-8000-00805F9B34FB',
    properties: 'READ · NOTIFY',
    purpose: 'Emite la trama binaria de 12 bytes cada vez que cambia el marcador o saque.',
  },
  {
    name: 'CHAR_ACK_SEQ',
    uuid: '0000FE52-0000-1000-8000-00805F9B34FB',
    properties: 'WRITE_NO_RESPONSE',
    purpose: 'El móvil confirma el último seq recibido; el reloj limpia la cola Outbox hasta ese seq.',
  },
  {
    name: 'CHAR_MATCH_CONFIG',
    uuid: '0000FE53-0000-1000-8000-00805F9B34FB',
    properties: 'READ · WRITE',
    purpose: 'Permite configurar nombres de equipos, formato y puntaje objetivo desde el móvil.',
  },
];

export interface KotlinFileSpec {
  id: string;
  filename: string;
  module: string;
  summary: string;
  code: string;
}

export const KOTLIN_FILES: KotlinFileSpec[] = [
  {
    id: 'engine',
    filename: 'PickleballEngine.kt',
    module: ':shared-protocol',
    summary: 'Motor puro e inmutable de puntuación, rotación 0-0-2, Side-Out y empaquetado BLE de 12 bytes.',
    code: `package com.rallyultra.shared.engine

enum class TeamId { A, B }
enum class CourtSide { RIGHT, LEFT }
enum class MatchFormat { DOUBLES, SINGLES }
enum class ScoringRule { TRADITIONAL, RALLY }

data class MatchState(
    val matchId: String,
    val format: MatchFormat = MatchFormat.DOUBLES,
    val scoringRule: ScoringRule = ScoringRule.TRADITIONAL,
    val targetPoints: Int = 11,
    val scoreA: Int = 0,
    val scoreB: Int = 0,
    val servingTeam: TeamId = TeamId.A,
    val serverNumber: Int = if (format == MatchFormat.DOUBLES) 2 else 1,
    val serverSide: CourtSide = CourtSide.RIGHT,
    val setsWonA: Int = 0,
    val setsWonB: Int = 0,
    val seq: Int = 1,
    val isMatchOver: Boolean = false,
    val winner: TeamId? = null
) {
    fun callout(): String {
        val srv = if (servingTeam == TeamId.A) scoreA else scoreB
        val rcv = if (servingTeam == TeamId.A) scoreB else scoreA
        return if (format == MatchFormat.DOUBLES) "$srv - $rcv - $serverNumber" else "$srv - $rcv"
    }

    fun toBleFrame(eventCode: Byte): ByteArray {
        val frame = ByteArray(12)
        frame[0] = 0x50 // 'P' Magic
        frame[1] = (0x10 or (if (format == MatchFormat.DOUBLES) 0x01 else 0x00) or
            (if (scoringRule == ScoringRule.RALLY) 0x02 else 0x00)).toByte()
        frame[2] = ((seq shr 8) and 0xFF).toByte()
        frame[3] = (seq and 0xFF).toByte()
        val hash = matchId.hashCode()
        frame[4] = ((hash shr 8) and 0xFF).toByte()
        frame[5] = (hash and 0xFF).toByte()
        frame[6] = scoreA.coerceIn(0, 255).toByte()
        frame[7] = scoreB.coerceIn(0, 255).toByte()
        val winnerBits = when (winner) { TeamId.A -> 1; TeamId.B -> 2; null -> 0 }
        frame[8] = ((if (servingTeam == TeamId.B) 0x01 else 0x00) or
            (if (serverNumber == 2) 0x02 else 0x00) or
            (if (serverSide == CourtSide.LEFT) 0x04 else 0x00) or
            (if (isMatchOver) 0x08 else 0x00) or
            ((winnerBits and 0x03) shl 4)).toByte()
        frame[9] = (((setsWonA and 0x0F) shl 4) or (setsWonB and 0x0F)).toByte()
        frame[10] = eventCode
        frame[11] = crc8(frame, 11)
        return frame
    }

    private fun crc8(data: ByteArray, len: Int): Byte {
        var crc = 0
        for (i in 0 until len) {
            crc = crc xor (data[i].toInt() and 0xFF)
            repeat(8) {
                crc = if ((crc and 0x80) != 0) ((crc shl 1) xor 0x07) and 0xFF
                else (crc shl 1) and 0xFF
            }
        }
        return crc.toByte()
    }
}`,
  },
  {
    id: 'wear-ble',
    filename: 'WatchBleGattServer.kt',
    module: ':wear-app',
    summary: 'Servidor GATT en el Galaxy Watch Ultra con cola Room Outbox para tolerar desconexiones en cancha.',
    code: `package com.rallyultra.wear.ble

import android.annotation.SuppressLint
import android.bluetooth.*
import android.content.Context
import java.util.UUID

object GattUuids {
    val SERVICE: UUID = UUID.fromString("0000FE50-0000-1000-8000-00805F9B34FB")
    val CHAR_SCORE: UUID = UUID.fromString("0000FE51-0000-1000-8000-00805F9B34FB")
    val CHAR_ACK: UUID = UUID.fromString("0000FE52-0000-1000-8000-00805F9B34FB")
    val CCCD: UUID = UUID.fromString("00002902-0000-1000-8000-00805F9B34FB")
}

class WatchBleGattServer(
    private val context: Context,
    private val outboxDao: OutboxFrameDao,
    private val onConnectionChanged: (Boolean) -> Unit
) {
    private var gattServer: BluetoothGattServer? = null
    private var connectedDevice: BluetoothDevice? = null
    private val scoreChar = BluetoothGattCharacteristic(
        GattUuids.CHAR_SCORE,
        BluetoothGattCharacteristic.PROPERTY_READ or BluetoothGattCharacteristic.PROPERTY_NOTIFY,
        BluetoothGattCharacteristic.PERMISSION_READ
    ).apply {
        addDescriptor(BluetoothGattDescriptor(GattUuids.CCCD, BluetoothGattDescriptor.PERMISSION_READ or BluetoothGattDescriptor.PERMISSION_WRITE))
    }

    @SuppressLint("MissingPermission")
    fun start() {
        val manager = context.getSystemService(BluetoothManager::class.java)
        gattServer = manager.openGattServer(context, object : BluetoothGattServerCallback() {
            override fun onConnectionStateChange(device: BluetoothDevice, status: Int, newState: Int) {
                if (newState == BluetoothProfile.STATE_CONNECTED) {
                    connectedDevice = device
                    onConnectionChanged(true)
                    flushPendingFrames()
                } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                    connectedDevice = null
                    onConnectionChanged(false)
                }
            }

            override fun onCharacteristicWriteRequest(
                device: BluetoothDevice, requestId: Int, char: BluetoothGattCharacteristic,
                preparedWrite: Boolean, responseNeeded: Boolean, offset: Int, value: ByteArray
            ) {
                if (char.uuid == GattUuids.CHAR_ACK && value.size >= 2) {
                    val ackSeq = ((value[0].toInt() and 0xFF) shl 8) or (value[1].toInt() and 0xFF)
                    outboxDao.deleteUpToSeq(ackSeq)
                }
                if (responseNeeded) {
                    gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, 0, null)
                }
            }
        })

        val service = BluetoothGattService(GattUuids.SERVICE, BluetoothGattService.SERVICE_TYPE_PRIMARY)
        service.addCharacteristic(scoreChar)
        gattServer?.addService(service)
    }

    @SuppressLint("MissingPermission")
    fun publishFrame(seq: Int, payload: ByteArray) {
        outboxDao.insert(OutboxEntity(seq = seq, payload = payload))
        val target = connectedDevice ?: return
        scoreChar.value = payload
        gattServer?.notifyCharacteristicChanged(target, scoreChar, false)
    }

    @SuppressLint("MissingPermission")
    private fun flushPendingFrames() {
        val target = connectedDevice ?: return
        outboxDao.getAllOrdered().forEach { frame ->
            scoreChar.value = frame.payload
            gattServer?.notifyCharacteristicChanged(target, scoreChar, false)
        }
    }
}`,
  },
  {
    id: 'wear-ui',
    filename: 'WatchScoreScreen.kt',
    module: ':wear-app',
    summary: 'Pantalla Compose para Galaxy Watch Ultra con Botón Rápido Naranja, feedback háptico y Bloqueo de Sudor.',
    code: `package com.rallyultra.wear.ui

import android.view.KeyEvent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.*
import com.rallyultra.shared.engine.MatchState
import com.rallyultra.shared.engine.TeamId

@Composable
fun WatchScoreScreen(
    state: MatchState,
    bleConnected: Boolean,
    sweatLock: Boolean,
    onScoreTeam: (TeamId) -> Unit,
    onServeFault: () -> Unit,
    onUndo: () -> Unit
) {
    val haptics = LocalHapticFeedback.current

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0A0C0F))
            .onKeyEvent { event ->
                // Botón Rápido Naranja del Galaxy Watch Ultra (KeyEvent.KEYCODE_STEM_PRIMARY)
                if (event.nativeKeyEvent.action == KeyEvent.ACTION_DOWN &&
                    event.nativeKeyEvent.keyCode == KeyEvent.KEYCODE_STEM_PRIMARY && !sweatLock
                ) {
                    haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                    onScoreTeam(TeamId.A)
                    true
                } else false
            }
    ) {
        Column(
            modifier = Modifier.fillMaxSize().padding(14.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = if (bleConnected) "BLE ACTIVO" else "COLA OFFLINE",
                color = if (bleConnected) Color(0xFF4ADE80) else Color(0xFFFB923C),
                fontSize = 10.sp,
                fontWeight = FontWeight.SemiBold
            )

            Row(
                modifier = Modifier.fillMaxWidth().weight(1f),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                ScoreQuadrant(
                    label = "NOSOTROS",
                    score = state.scoreA,
                    isServing = state.servingTeam == TeamId.A,
                    accent = Color(0xFFFF5A1F),
                    enabled = !sweatLock,
                    modifier = Modifier.weight(1f).fillMaxHeight()
                ) {
                    haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                    onScoreTeam(TeamId.A)
                }

                ScoreQuadrant(
                    label = "RIVAL",
                    score = state.scoreB,
                    isServing = state.servingTeam == TeamId.B,
                    accent = Color(0xFF38BDF8),
                    enabled = !sweatLock,
                    modifier = Modifier.weight(1f).fillMaxHeight()
                ) {
                    haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                    onScoreTeam(TeamId.B)
                }
            }

            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                CompactChip(
                    onClick = onServeFault,
                    enabled = !sweatLock,
                    label = { Text("Saque \${state.serverNumber}") }
                )
                CompactChip(
                    onClick = onUndo,
                    enabled = !sweatLock,
                    label = { Text("Deshacer") }
                )
            }
        }
    }
}`,
  },
  {
    id: 'mobile-ble',
    filename: 'MobileBleSyncClient.kt',
    module: ':mobile-app',
    summary: 'Cliente Bluetooth GATT en el smartphone Android con reconexión automática y ACK de secuencia.',
    code: `package com.rallyultra.mobile.ble

import android.annotation.SuppressLint
import android.bluetooth.*
import android.content.Context
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.UUID

class MobileBleSyncClient(private val context: Context) {
    private val _connectionState = MutableStateFlow(false)
    val connectionState = _connectionState.asStateFlow()

    private val _latestRawFrame = MutableStateFlow<ByteArray?>(null)
    val latestRawFrame = _latestRawFrame.asStateFlow()

    private var gatt: BluetoothGatt? = null
    private var ackChar: BluetoothGattCharacteristic? = null

    @SuppressLint("MissingPermission")
    fun connectToWatch(device: BluetoothDevice) {
        gatt = device.connectGatt(context, /* autoConnect = */ true, object : BluetoothGattCallback() {
            override fun onConnectionStateChange(g: BluetoothGatt, status: Int, newState: Int) {
                val connected = newState == BluetoothProfile.STATE_CONNECTED
                _connectionState.value = connected
                if (connected) g.discoverServices()
            }

            override fun onServicesDiscovered(g: BluetoothGatt, status: Int) {
                val service = g.getService(UUID.fromString("0000FE50-0000-1000-8000-00805F9B34FB")) ?: return
                val scoreChar = service.getCharacteristic(UUID.fromString("0000FE51-0000-1000-8000-00805F9B34FB"))
                ackChar = service.getCharacteristic(UUID.fromString("0000FE52-0000-1000-8000-00805F9B34FB"))

                g.setCharacteristicNotification(scoreChar, true)
                val cccd = scoreChar.getDescriptor(UUID.fromString("00002902-0000-1000-8000-00805F9B34FB"))
                cccd.value = BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE
                g.writeDescriptor(cccd)
            }

            override fun onCharacteristicChanged(g: BluetoothGatt, char: BluetoothGattCharacteristic, value: ByteArray) {
                _latestRawFrame.value = value
                sendAck(g, value[2], value[3])
            }
        }, BluetoothDevice.TRANSPORT_LE)
    }

    @SuppressLint("MissingPermission")
    private fun sendAck(g: BluetoothGatt, seqHi: Byte, seqLo: Byte) {
        val target = ackChar ?: return
        target.writeType = BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE
        target.value = byteArrayOf(seqHi, seqLo)
        g.writeCharacteristic(target)
    }
}`,
  },
];
