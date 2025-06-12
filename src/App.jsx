import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer } from 'react-konva';

function App() {
  const videoRef = useRef(null);
  const [imageObj, setImageObj] = useState(null);
  const [imageOpacity, setImageOpacity] = useState(0.5);
  const [imageScale, setImageScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
const [isFlipped, setIsFlipped] = useState(false);
  const imageRef = useRef();
  const transformerRef = useRef();
  const [isSelected, setIsSelected] = useState(false);

  // Novo: zoom da câmera
  const [cameraZoom, setCameraZoom] = useState(1);
  const [zoomSupported, setZoomSupported] = useState(false);
  const [zoomRange, setZoomRange] = useState({ min: 1, max: 1 });
  const videoTrackRef = useRef(null);
  const [showMenu, setShowMenu] = useState(window.innerWidth > 768);
const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [stageSize, setStageSize] = useState({
  width: window.innerWidth,
  height: window.innerHeight,
});

  const handleImageChange = (e) => {

    const file = e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.src = url;
    img.onload = () => {
      setImageObj(img);
      setIsSelected(true); // seleciona por padrão ao carregar
    };
  };

  const handleZoomChange = async (e) => {
    

    const newZoom = parseFloat(e.target.value);
    setCameraZoom(newZoom);

    if (videoTrackRef.current) {
      try {
        await videoTrackRef.current.applyConstraints({
          advanced: [{ zoom: newZoom }]
        });
      } catch (err) {
        console.warn('Erro ao aplicar zoom:', err.message);
      }
    }
  };

  useEffect(() => {
    if (isSelected && transformerRef.current && imageRef.current) {
      transformerRef.current.nodes([imageRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected, imageObj]);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      })
      .catch((err) => {
        alert('Erro ao acessar a câmera: ' + err.message);
      });
  }, []);

  useEffect(() => {
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    .then((stream) => {
      const [track] = stream.getVideoTracks();
      videoTrackRef.current = track;

      const capabilities = track.getCapabilities?.();
      if (capabilities && capabilities.zoom) {
        setZoomSupported(true);
        setZoomRange({ min: capabilities.zoom.min, max: capabilities.zoom.max });
        setCameraZoom(track.getSettings().zoom || capabilities.zoom.min);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    })
    .catch((err) => {
      alert('Erro ao acessar a câmera: ' + err.message);
    });
}, []);

useEffect(() => {
  const handleResize = () => {
    const isNowMobile = window.innerWidth <= 768;
    setIsMobile(isNowMobile);
    setStageSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    // Opcional: fecha o menu se virou mobile
    if (isNowMobile) {
      setShowMenu(false);
    } else {
      setShowMenu(true);
    }
  };

  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 1
        }}
      />

      <Stage width={stageSize.width -10} height={stageSize.height - 10}
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 2 }}
        onMouseDown={(e) => {
          // desmarca ao clicar fora
          if (e.target === e.target.getStage()) {
            setIsSelected(false);
          }
        }}
      >
        <Layer>
          {imageObj && (
            <>
              <KonvaImage
                image={imageObj}
                x={position.x}
                y={position.y}
                draggable
                // scaleX={imageScale}
                scaleX={imageScale * (isFlipped ? -1 : 1)}
                scaleY={imageScale}
                opacity={imageOpacity}
                ref={imageRef}
                onDragEnd={(e) => {
                  setPosition({ x: e.target.x(), y: e.target.y() });
                }}
                onClick={() => setIsSelected(true)}
                onTap={() => setIsSelected(true)}
              />
              {isSelected && (
                <Transformer
                  ref={transformerRef}
                  boundBoxFunc={(oldBox, newBox) => {
                    if (newBox.width < 10 || newBox.height < 10) {
                      return oldBox;
                    }
                    return newBox;
                  }}
                />
              )}
            </>
          )}
        </Layer>
      </Stage>


{(showMenu || !isMobile) && (

      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        background: '#000000aa',
        padding: 10,
        borderRadius: 8,
        zIndex: 3,
        color: 'white',
        width: 300
      }}>
        <input type="file" accept="image/*" onChange={handleImageChange} />
        <br />
        <label>
          Opacidade: {imageOpacity.toFixed(2)}
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={imageOpacity}
            onChange={(e) => setImageOpacity(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>

        <label>
          Zoom: {imageScale.toFixed(2)}x
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.01"
            value={imageScale}
            onChange={(e) => setImageScale(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>

        {zoomSupported && (
          <label>
            Zoom da câmera: {cameraZoom.toFixed(2)}x
            <input
              type="range"
              min={zoomRange.min}
              max={zoomRange.max}
              step="0.1"
              value={cameraZoom}
              onChange={handleZoomChange}
              style={{ width: '100%' }}
            />
          </label>
        )}


        <button onClick={() => setIsFlipped(!isFlipped)} style={{ marginTop: 10, width: '100%' }}>
          {isFlipped ? 'Desespelhar imagem' : 'Espelhar imagem'}
        </button>
      </div>

)}

      {isMobile && (
  <button
    onClick={() => setShowMenu((prev) => !prev)}
    style={{
      position: 'absolute',
      // bottom: 20,
      // right: 20,
      zIndex: 4,
      background: '#000000dd',
      color: 'white',
      border: 'none',
      borderRadius: '50%',
      width: 50,
      height: 50,
      fontSize: 24,
      cursor: 'pointer'
    }}
    title={showMenu ? 'Fechar menu' : 'Abrir menu'}
  >
    {showMenu ? '✖' : '☰'}
  </button>
)}


    </div>
  );
}

export default App;
