{
        "targets": [
                {
                        "target_name": "index",
                        "sources": [
                                "Core.cpp"
                        ],
                        "include_dirs": [
                                "<(module_root_dir)/include"
                        ],
                        "defines": [
                                "NAPI_CPP_EXCEPTIONS"
                        ],
                        "libraries": [
                                "<(module_root_dir)/lib/enet64.lib",
                                "ws2_32.lib",
                                "winmm.lib"
                        ]
                }
        ]
}
