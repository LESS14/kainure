FROM ubuntu:18.04

ARG CMAKE_VERSION=4.2.0

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    software-properties-common \
    && add-apt-repository ppa:ubuntu-toolchain-r/test \
    && apt-get update

RUN dpkg --add-architecture i386

RUN apt-get update

RUN apt-get install -y --no-install-recommends \
    build-essential \
    gcc-9 \
    g++-9 \
    gcc-9-multilib \
    g++-9-multilib \
    linux-libc-dev:i386 \
    libc6-dev:i386 \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-9 90 \
    --slave /usr/bin/g++ g++ /usr/bin/g++-9 \
    --slave /usr/bin/gcov gcov /usr/bin/gcov-9

RUN wget -q https://github.com/Kitware/CMake/releases/download/v${CMAKE_VERSION}/cmake-${CMAKE_VERSION}-Linux-x86_64.sh \
    && chmod +x cmake-${CMAKE_VERSION}-Linux-x86_64.sh \
    && ./cmake-${CMAKE_VERSION}-Linux-x86_64.sh --prefix=/usr/local --skip-license \
    && rm cmake-${CMAKE_VERSION}-Linux-x86_64.sh

WORKDIR /workspace