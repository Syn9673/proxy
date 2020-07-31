#include <iostream>
#include "../node_modules/node-addon-api/napi.h"
#include <enet/enet.h>
#include <map>

ENetAddress address;
ENetHost* client;
ENetPeer* peer;
ENetHost* server;
ENetPeer* clientPeer;
ENetAddress proxyAddress;
std::string ip;
int port;

void init_client(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    ip = info[0].As<Napi::String>().Utf8Value();
    port = info[1].As<Napi::Number>().Uint32Value();
    bool a = info[2].As<Napi::Boolean>().ToBoolean();

    if (!a)
        if (enet_initialize() < 0) Napi::TypeError::New(env, "Failed to initialize ENet.");

    address.port = port;

    client = enet_host_create(NULL, 1, 2, 0, 0);
    enet_address_set_host(&address, ip.c_str());

    client->checksum = enet_crc32;
    enet_host_compress_with_range_coder(client);

    std::cout << "ENet Client Created" << std::endl;

    peer = enet_host_connect(client, &address, 2, 0);
}

void init_server(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    proxyAddress.host = ENET_HOST_ANY;
    proxyAddress.port = 17091;

    server = enet_host_create(&proxyAddress, 1024, 2, 0, 0);

    server->checksum = enet_crc32;
    enet_host_compress_with_range_coder(server);

    std::cout << "Proxy Server Created" << std::endl;
}

void check_events(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    // handlers
    Napi::Function on_conn = info[0].As<Napi::Function>();
    Napi::Function on_msg = info[1].As<Napi::Function>();

    ENetEvent event;
    while(enet_host_service(client, &event, 0) > 0) {
        switch (event.type) {
            case ENET_EVENT_TYPE_CONNECT: {
                peer = event.peer;
                // add peer to the map
                on_conn.Call({
                    Napi::String::New(env, std::to_string(event.peer->connectID))
                });
                break;
            }

            case ENET_EVENT_TYPE_RECEIVE: {
                on_msg.Call({
                    Napi::String::New(env, std::to_string(event.peer->connectID)),
                    Napi::ArrayBuffer::New(env, (unsigned char *)event.packet->data, event.packet->dataLength)
                });
                break;
            }

            case ENET_EVENT_TYPE_DISCONNECT: {
                peer = NULL;
                break;
            }
        }
    }
}

void check_events_server(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    // handlers
    Napi::Function on_conn = info[0].As<Napi::Function>();
    Napi::Function on_msg = info[1].As<Napi::Function>();

    ENetEvent event;
    while(enet_host_service(server, &event, 0) > 0) {
        switch (event.type) {
            case ENET_EVENT_TYPE_CONNECT: {
                clientPeer = event.peer;
                // add peer to the map
                on_conn.Call({
                    Napi::String::New(env, std::to_string(event.peer->connectID))
                });
                break;
            }

            case ENET_EVENT_TYPE_RECEIVE: {
                on_msg.Call({
                    Napi::String::New(env, std::to_string(event.peer->connectID)),
                    Napi::ArrayBuffer::New(env, (unsigned char *)event.packet->data, event.packet->dataLength)
                });
                break;
            }

            case ENET_EVENT_TYPE_DISCONNECT: {
                clientPeer = NULL;
                std::cout << "oofed" << std::endl;
                break;
            }
        }
    }
}

void send_packet(const Napi::CallbackInfo& info) {
    Napi::Buffer<unsigned char *> buffer = info[0].As<Napi::Buffer<unsigned char *>>();
    ENetPacket* packet = enet_packet_create(buffer.Data(), buffer.ByteLength(), ENET_PACKET_FLAG_RELIABLE);

    enet_peer_send(peer, 0, packet);
}

void disconnect(const Napi::CallbackInfo& info) {
    enet_peer_disconnect_later(peer, 0);
}

void disconnect_client(const Napi::CallbackInfo& info) {
    enet_peer_disconnect_later(clientPeer, 0);
}

void send_packet_to_client(const Napi::CallbackInfo& info) {
    Napi::Buffer<unsigned char *> buffer = info[0].As<Napi::Buffer<unsigned char *>>();
    ENetPacket* packet = enet_packet_create(buffer.Data(), buffer.ByteLength(), ENET_PACKET_FLAG_RELIABLE);

    enet_peer_send(clientPeer, 0, packet);
}

Napi::Object init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "init"), Napi::Function::New(env, init_client));
    exports.Set(Napi::String::New(env, "events"), Napi::Function::New(env, check_events));
    exports.Set(Napi::String::New(env, "check_events_server"), Napi::Function::New(env, check_events_server));
    exports.Set(Napi::String::New(env, "init_server"), Napi::Function::New(env, init_server));
    exports.Set(Napi::String::New(env, "send"), Napi::Function::New(env, send_packet));
    exports.Set(Napi::String::New(env, "send_client"), Napi::Function::New(env, send_packet_to_client));
    exports.Set(Napi::String::New(env, "disconnect"), Napi::Function::New(env, disconnect));
    exports.Set(Napi::String::New(env, "disconnect_client"), Napi::Function::New(env, disconnect_client));
    return exports;
}

NODE_API_MODULE(Core, init)