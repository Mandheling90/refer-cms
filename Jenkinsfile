pipeline {
    agent {
        kubernetes {
            yaml '''
                apiVersion: v1
                kind: Pod
                metadata:
                  labels:
                    jenkins: agent
                spec:
                  containers:
                  - name: docker
                    image: docker:24-dind
                    securityContext:
                      privileged: true
                    env:
                    - name: DOCKER_TLS_CERTDIR
                      value: ""
                    resources:
                      requests:
                        cpu: "250m"
                        memory: "512Mi"
                      limits:
                        cpu: "1000m"
                        memory: "2Gi"
                  - name: node
                    image: node:20-alpine
                    command: [cat]
                    tty: true
                    env:
                    - name: DOCKER_HOST
                      value: tcp://localhost:2375
                    resources:
                      requests:
                        cpu: "250m"
                        memory: "512Mi"
                      limits:
                        cpu: "1000m"
                        memory: "2Gi"
                  - name: git
                    image: alpine/git:latest
                    command: [cat]
                    tty: true
            '''
        }
    }

    environment {
        // NCP Container Registry 설정
        NCR_REGISTRY = 'kumc.kr.ncr.ntruss.com'
        IMAGE_NAME = 'hmp-cc-crm'

        // GitLab 저장소 (사설망)
        GITLAB_HOST = '10.101.51.7'
        GITLAB_REPO = "http://${GITLAB_HOST}/kumc/crm.git"
        GITOPS_REPO = "http://${GITLAB_HOST}/kumc/gitops.git"
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {
        stage('Checkout') {
            steps {
                echo "Checking out source code..."
                git branch: 'main',
                    credentialsId: 'gitlab-credentials',
                    url: "${GITLAB_REPO}"
            }
        }

        stage('Install Dependencies') {
            steps {
                container('node') {
                    echo "Installing npm dependencies..."
                    sh '''
                        npm ci --prefer-offline
                    '''
                }
            }
        }

        stage('Lint') {
            steps {
                container('node') {
                    echo "Running ESLint..."
                    sh '''
                        npm run lint || true
                    '''
                }
            }
        }

        stage('Build') {
            steps {
                container('node') {
                    echo "Building Next.js application..."
                    sh '''
                        npm run build
                    '''
                }
            }
        }

        stage('Docker Build & Push') {
            steps {
                container('docker') {
                    echo "Building and pushing Docker image..."
                    withCredentials([usernamePassword(
                        credentialsId: 'ncr-credentials',
                        usernameVariable: 'NCR_USER',
                        passwordVariable: 'NCR_PASS'
                    )]) {
                        sh '''
                            # Docker 레지스트리 로그인
                            echo $NCR_PASS | docker login $NCR_REGISTRY -u $NCR_USER --password-stdin

                            # 이미지 태그 설정 (Git 커밋 SHA 앞 7자리)
                            IMAGE_TAG=$(echo $GIT_COMMIT | cut -c1-7)

                            # Docker 이미지 빌드
                            docker build -t $NCR_REGISTRY/$IMAGE_NAME:$IMAGE_TAG .

                            # latest 태그 추가
                            docker tag $NCR_REGISTRY/$IMAGE_NAME:$IMAGE_TAG $NCR_REGISTRY/$IMAGE_NAME:latest

                            # 이미지 푸시
                            docker push $NCR_REGISTRY/$IMAGE_NAME:$IMAGE_TAG
                            docker push $NCR_REGISTRY/$IMAGE_NAME:latest

                            echo "Pushed image: $NCR_REGISTRY/$IMAGE_NAME:$IMAGE_TAG"
                        '''
                    }
                }
            }
        }

        stage('Update GitOps') {
            steps {
                container('git') {
                    echo "Updating GitOps repository..."
                    withCredentials([usernamePassword(
                        credentialsId: 'gitlab-credentials',
                        usernameVariable: 'GIT_USER',
                        passwordVariable: 'GIT_PASS'
                    )]) {
                        sh '''
                            # 이미지 태그
                            IMAGE_TAG=$(echo $GIT_COMMIT | cut -c1-7)

                            # GitOps 저장소 클론
                            git clone http://${GIT_USER}:${GIT_PASS}@${GITLAB_HOST}/kumc/gitops.git gitops

                            cd gitops

                            # Development 환경 CRM 이미지 태그 업데이트
                            sed -i "s|newTag:.*|newTag: \"${IMAGE_TAG}\"|g" overlays/development/crm/kustomization.yaml

                            # Git 설정
                            git config user.email "jenkins@kumc.example.com"
                            git config user.name "Jenkins CI"

                            # 변경사항 커밋 및 푸시
                            git add .
                            git diff --staged --quiet || git commit -m "Update crm image to ${IMAGE_TAG}"
                            git push

                            echo "GitOps repository updated with image tag: ${IMAGE_TAG}"
                        '''
                    }
                }
            }
        }
    }

    post {
        always {
            echo "Cleaning up workspace..."
            cleanWs()
        }
        success {
            echo "Pipeline completed successfully!"
        }
        failure {
            echo "Pipeline failed!"
        }
    }
}
