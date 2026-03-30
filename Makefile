CLI_ARGS := $(wordlist 2,$(words $(MAKECMDGOALS)),$(MAKECMDGOALS))
$(eval $(sort $(subst :,\:,$(CLI_ARGS))):;@:)

PRIMARY_GOAL := $(firstword $(MAKECMDGOALS))
ifeq ($(PRIMARY_GOAL),)
    PRIMARY_GOAL := help
endif

DC := docker compose -f docker-compose.yml

ifeq ($(PRIMARY_GOAL),run)
	shq = '$(subst ','"'"',$(1))'
	EXEC ?= $(CLI_ARGS)
	EXEC_SH := $(call shq,$(EXEC))
endif

#
# Development
#

ifeq ($(PRIMARY_GOAL),build)
build: ## Build docker images
	$(DC) build $(CLI_ARGS)
endif

ifeq ($(PRIMARY_GOAL),ps)
ps: ## show list of containers
	$(DC) ps $(CLI_ARGS)
endif

ifeq ($(PRIMARY_GOAL),logs)
logs: ## Show container logs
	$(DC) logs $(CLI_ARGS)
endif

ifeq ($(PRIMARY_GOAL),up)
up:## Up containers
	$(DC) up -d $(CLI_ARGS)
endif

ifeq ($(PRIMARY_GOAL),down)
down:## Down containers
	$(DC) down --remove-orphans $(CLI_ARGS)
endif

ifeq ($(PRIMARY_GOAL),stop)
stop:## Stop containers
	$(DC) stop $(CLI_ARGS)
endif

ifeq ($(PRIMARY_GOAL),restart)
restart:## Restart containers
	$(DC) stop $(CLI_ARGS)
	$(DC) start $(CLI_ARGS)
endif

#
# Shell
#

ifeq ($(PRIMARY_GOAL),postgres)
postgres:## Open shell in postgres container
	$(DC) exec postgres bash
endif

#
# Other
#

ifeq ($(PRIMARY_GOAL),help)
# Output the help for each task, see https://marmelab.com/blog/2016/02/29/auto-documented-makefile.html
help: ## This help.
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
endif