docker build -t siacentral/web/ledger .
docker tag siacentral/web/ledger:latest 921261815063.dkr.ecr.us-east-2.amazonaws.com/siacentral/web/ledger:latest
docker push 921261815063.dkr.ecr.us-east-2.amazonaws.com/siacentral/web/ledger:latest