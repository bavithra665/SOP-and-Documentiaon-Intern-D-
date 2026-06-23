from rest_framework import serializers


class SOPGeneratorSerializer(serializers.Serializer):
    process_name = serializers.CharField(max_length=255, required=True)


class DocumentSummarySerializer(serializers.Serializer):
    document_id = serializers.IntegerField(required=True)


class SOPSimplifierSerializer(serializers.Serializer):
    sop_id = serializers.IntegerField(required=True)


class DocumentChatSerializer(serializers.Serializer):
    document_id = serializers.IntegerField(required=True)
    question = serializers.CharField(max_length=1000, required=True)


class SmartSearchSerializer(serializers.Serializer):
    query = serializers.CharField(max_length=500, required=True)
