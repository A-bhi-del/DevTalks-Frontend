import * as mediasoupClient from "mediasoup-client";
import getSocket from "./socket";

export default class MediaCall {
  constructor(roomId, localUserId, options = {}) {
    this.roomId = roomId;
    this.localUserId = localUserId;
    this.socket = getSocket();
    this.audioOnly = options.audioOnly || false; // For voice calls

    this.device = null;
    this.sendTransport = null;
    this.recvTransport = null;
    this.localStream = null;
    this.remoteStream = null; // Single stream that accumulates all remote tracks

    // Bind the listener function so we can remove it later
    this.handleNewProducer = this.handleNewProducer.bind(this);
    this.onRemoteStream = () => { };
  }

  async init() {
    console.log(`[MediaCall] Joining room: ${this.roomId}, audioOnly: ${this.audioOnly}`);

    const joinData = await new Promise((resolve) => {
      this.socket.emit(
        "joinRoom",
        { roomId: this.roomId, userId: this.localUserId },
        resolve
      );
    });

    if (joinData?.error) {
      console.error("[MediaCall] Join Room Error:", joinData.error);
      throw new Error(joinData.error);
    }

    try {
      this.device = new mediasoupClient.Device();
      await this.device.load({
        routerRtpCapabilities: joinData.routerRtpCapabilities,
      });
    } catch (error) {
      console.error("[MediaCall] Device Load Error:", error);
      if (error.name === 'UnsupportedError') {
        console.warn('Browser not supported');
      }
    }

    // CRITICAL: Create transports FIRST before any consume operations
    await this.createSendTransport();
    await this.createRecvTransport();

    // Set up listener for NEW users joining after us
    this.socket.on("newProducer", this.handleNewProducer);

    // Consume EXISTING users who are already there (AFTER recvTransport is created!)
    if (joinData.existingProducerIds && joinData.existingProducerIds.length > 0) {
      console.log(`[MediaCall] Consuming ${joinData.existingProducerIds.length} existing producers`);
      for (const producerId of joinData.existingProducerIds) {
        await this.consumeAndNotify(producerId);
      }
    }

    return this.localStream;
  }

  async handleNewProducer(producerId) {
    console.log("[MediaCall] New producer detected:", producerId);
    await this.consumeAndNotify(producerId);
  }

  async consumeAndNotify(producerId) {
    const track = await this.consume(producerId);
    if (track) {
      // FIXED: Merge tracks into single remoteStream instead of replacing
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream([track]);
        console.log(`[MediaCall] Created remote stream with first track: ${track.kind}`);
      } else {
        // Remove existing track of same kind before adding new one (prevents duplicates)
        const existingTracks = track.kind === 'video'
          ? this.remoteStream.getVideoTracks()
          : this.remoteStream.getAudioTracks();
        existingTracks.forEach(t => this.remoteStream.removeTrack(t));

        this.remoteStream.addTrack(track);
        console.log(`[MediaCall] Added ${track.kind} track to remote stream`);
      }

      // Notify with the merged stream
      if (this.onRemoteStream) {
        this.onRemoteStream(this.remoteStream);
      }
    }
  }

  async createSendTransport() {
    const params = await new Promise((resolve) => {
      this.socket.emit("createTransport", { roomId: this.roomId }, resolve);
    });

    this.sendTransport = this.device.createSendTransport(params);

    this.sendTransport.on("connect", ({ dtlsParameters }, cb) => {
      this.socket.emit("connectTransport", {
        transportId: this.sendTransport.id,
        dtlsParameters,
      });
      cb();
    });

    this.sendTransport.on("produce", ({ kind, rtpParameters }, cb) => {
      this.socket.emit(
        "produce",
        {
          roomId: this.roomId,
          transportId: this.sendTransport.id,
          kind,
          rtpParameters,
        },
        ({ id }) => cb({ id })
      );
    });

    // Get user media based on audioOnly flag
    const constraints = this.audioOnly
      ? { video: false, audio: true }
      : { video: true, audio: true };

    console.log(`[MediaCall] Getting user media with constraints:`, constraints);
    this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

    // Produce all tracks
    for (const track of this.localStream.getTracks()) {
      console.log(`[MediaCall] Producing ${track.kind} track`);
      await this.sendTransport.produce({ track });
    }
  }

  async createRecvTransport() {
    const params = await new Promise((resolve) => {
      this.socket.emit("createTransport", { roomId: this.roomId }, resolve);
    });

    this.recvTransport = this.device.createRecvTransport(params);

    this.recvTransport.on("connect", ({ dtlsParameters }, cb) => {
      this.socket.emit("connectTransport", {
        transportId: this.recvTransport.id,
        dtlsParameters,
      });
      cb();
    });
  }

  async consume(producerId) {
    const data = await new Promise((resolve) => {
      this.socket.emit(
        "consume",
        {
          roomId: this.roomId,
          producerId,
          transportId: this.recvTransport.id,
          rtpCapabilities: this.device.rtpCapabilities,
        },
        resolve
      );
    });

    if (data.error) {
      console.error("Cannot consume:", data.error);
      return null;
    }

    const consumer = await this.recvTransport.consume({
      id: data.id,
      producerId: data.producerId,
      kind: data.kind,
      rtpParameters: data.rtpParameters,
    });

    console.log(`[MediaCall] Consumed ${consumer.kind} track from producer ${producerId}`);

    // Return just the track, not a new MediaStream
    return consumer.track;
  }

  close() {
    console.log("[MediaCall] Closing resources");
    // Stop listening to socket events to prevent leaks
    this.socket.off("newProducer", this.handleNewProducer);

    this.sendTransport?.close();
    this.recvTransport?.close();
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.remoteStream = null;
  }
}