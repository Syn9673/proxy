interface TankPacket {
    net_id?: number;
    type?: number;
    x?: number;
    y?: number;
    state?: number;
    block?: number;
    x_speed?: number;
    y_speed?: number;
    x_punch?: number;
    y_punch?: number;
    extra_data?: (packet: Buffer) => Buffer;

}

class Tank implements TankPacket {
    public net_id: number;
    public type: number;
    public x: number;
    public y: number;
    public state: number;
    public block: number;
    public x_speed: number;
    public y_speed: number;
    public x_punch: number;
    public y_punch: number;
    public extra_data: (packet: Buffer) => Buffer;
    private data: Buffer;

    constructor() {}

    public pack(data: TankPacket): Tank {
        let packet: Buffer = Buffer.alloc(60);

        packet.writeUInt32LE(data.type);
        packet.writeInt32LE(data.net_id, 4);
        packet.writeUInt32LE(data.state, 12);
        packet.writeUInt32LE(data.block, 20);
        packet.writeFloatLE(data.x, 24);
        packet.writeFloatLE(data.y, 28);
        packet.writeFloatLE(data.x_speed, 32);
        packet.writeFloatLE(data.y_speed, 36);
        packet.writeInt32LE(data.x_punch, 44);
        packet.writeInt32LE(data.y_punch, 48);

        const extra_data: Buffer = data.extra_data ? data.extra_data(packet) : packet;

        this.data = Buffer.concat([Buffer.from([4, 0, 0, 0]), extra_data]);
        return this;
    }

    public unpack(data: Buffer): TankPacket {
        let tank_packet: TankPacket = {};
        data = data.slice(4); // remove the first four bytes
        tank_packet.type = data[0];
        tank_packet.net_id = data.readInt32LE(4);
        tank_packet.state = data.readUInt32LE(12);
        tank_packet.block = data.readUInt32LE(20);
        tank_packet.x = data.readFloatLE(24);
        tank_packet.y = data.readFloatLE(28);
        tank_packet.x_speed = data.readFloatLE(32);
        tank_packet.y_speed = data.readFloatLE(36);
        tank_packet.x_punch = data.readInt32LE(44);
        tank_packet.y_punch = data.readInt32LE(48);

        return tank_packet;
    }
}

export default Tank;