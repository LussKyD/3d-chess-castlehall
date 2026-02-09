import React, { Suspense, useEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

class ModelErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch() {}

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null
    }
    return this.props.children
  }
}

function TintedModel({ url, tint, ...props }) {
  const { scene } = useGLTF(url)
  const cloned = useMemo(() => scene.clone(true), [scene])

  useEffect(() => {
    if (!cloned) return
    cloned.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        if (tint && child.material && child.material.color) {
          const material = child.material.clone()
          material.color = new THREE.Color(tint)
          child.material = material
        }
      }
    })
  }, [cloned, tint])

  return <primitive object={cloned} {...props} />
}

export default function Model({ url, fallback, tint, ...props }) {
  if (!url) {
    return fallback || null
  }

  return (
    <ModelErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback || null}>
        <TintedModel url={url} tint={tint} {...props} />
      </Suspense>
    </ModelErrorBoundary>
  )
}
